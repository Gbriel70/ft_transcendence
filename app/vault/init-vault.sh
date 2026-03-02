#!/bin/bash

set -e

# ==================== CONFIGS =======================#
export VAULT_ADDR='http://0.0.0.0:8200'
VAULT_DATA_DIR="/vault/data"
VAULT_KEYS_FILE="$VAULT_DATA_DIR/vault-keys.env"
INIT_KEYS_FILE="$VAULT_DATA_DIR/init-keys.json"
APPROLE_DIR="$VAULT_DATA_DIR/approles"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}  $1${NC}"; }
log_success() { echo -e "${GREEN}  $1${NC}"; }
log_warning() { echo -e "${YELLOW}  $1${NC}"; }
log_error() { echo -e "${RED}  $1${NC}"; }

# ==================== START VAULT ====================
log_info "Starting Vault Server..."

vault server -config=/vault/config/vault-config.hcl > /vault/logs/vault.log 2>&1 &
VAULT_PID=$!

log_info "Vault PID: $VAULT_PID"
log_info "Vault Address: $VAULT_ADDR"

# ==================== WAIT FOR VAULT ====================
log_info "Waiting for Vault HTTP endpoint..."

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    # TEST HTTP ENDPOINT
    if curl -sf -o /dev/null "$VAULT_ADDR/v1/sys/health" 2>/dev/null || \
       curl -sf -o /dev/null "$VAULT_ADDR/v1/sys/seal-status" 2>/dev/null; then
        log_success "Vault HTTP is responding! (attempt $ATTEMPT)"
        sleep 2
        break
    fi
    
    # CHECK IF PROCESS DIED
    if ! kill -0 $VAULT_PID 2>/dev/null; then
        log_error "Vault process died!"
        tail -n 30 /vault/logs/vault.log
        exit 1
    fi
    
    [ $((ATTEMPT % 5)) -eq 0 ] && log_info "Still waiting... ($ATTEMPT/$MAX_ATTEMPTS)" || echo -n "."
    sleep 1
done

echo ""

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    log_error "Vault failed to respond after $MAX_ATTEMPTS seconds!"
    tail -n 30 /vault/logs/vault.log
    exit 1
fi

# ==================== VERIFY VAULT ====================
log_info "Checking Vault status..."

if vault status 2>/dev/null; then
    log_info "Vault status check passed"
else
    log_info "Vault is running but not yet initialized (expected)"
fi

# ==================== INITIALIZE ====================
log_info "Initializing Vault..."

# CHECK IF ALREADY INITIALIZED
VAULT_STATUS_OUTPUT=$(vault status -format=json 2>/dev/null || echo '{"initialized":false}')
IS_INITIALIZED=$(echo "$VAULT_STATUS_OUTPUT" | grep -o '"initialized":[^,}]*' | cut -d':' -f2 | tr -d ' ')

if [ "$IS_INITIALIZED" = "true" ]; then
    log_warning "Vault already initialized"
    ALREADY_INITIALIZED=true
else
    log_info "Performing initial setup (5 shares, 3 threshold)..."
    
    vault operator init \
        -key-shares=5 \
        -key-threshold=3 \
        -format=json > "$INIT_KEYS_FILE" 2>&1
    
    if [ ! -s "$INIT_KEYS_FILE" ]; then
        log_error "Init failed!"
        cat "$INIT_KEYS_FILE" 2>/dev/null || true
        exit 1
    fi
    
    log_success "Initialized!"
    ALREADY_INITIALIZED=false
fi

# ==================== EXTRACT KEYS ====================
if [ "$ALREADY_INITIALIZED" = false ]; then
    log_info "Extracting keys..."
    
    UNSEAL_KEY_1=$(jq -r '.unseal_keys_b64[0]' "$INIT_KEYS_FILE")
    UNSEAL_KEY_2=$(jq -r '.unseal_keys_b64[1]' "$INIT_KEYS_FILE")
    UNSEAL_KEY_3=$(jq -r '.unseal_keys_b64[2]' "$INIT_KEYS_FILE")
    ROOT_TOKEN=$(jq -r '.root_token' "$INIT_KEYS_FILE")
    
    if [ -z "$UNSEAL_KEY_1" ] || [ "$UNSEAL_KEY_1" = "null" ]; then
        log_error "Failed to extract keys"
        cat "$INIT_KEYS_FILE"
        exit 1
    fi
    
    cat > "$VAULT_KEYS_FILE" <<EOF
VAULT_UNSEAL_KEY_1=$UNSEAL_KEY_1
VAULT_UNSEAL_KEY_2=$UNSEAL_KEY_2
VAULT_UNSEAL_KEY_3=$UNSEAL_KEY_3
VAULT_ROOT_TOKEN=$ROOT_TOKEN
EOF
    
    chmod 600 "$VAULT_KEYS_FILE"
    log_success "Keys saved"
else
    [ ! -f "$VAULT_KEYS_FILE" ] && { log_error "Keys file not found!"; exit 1; }
    source "$VAULT_KEYS_FILE"
    log_info "Keys loaded"
fi

# ==================== UNSEAL ====================
log_info "Unsealing Vault..."

SEAL_STATUS=$(vault status -format=json 2>/dev/null | jq -r '.sealed' 2>/dev/null || echo "true")

if [ "$SEAL_STATUS" = "false" ]; then
    log_info "Already unsealed"
else
    log_info "Unsealing (3/5 keys)..."
    
    vault operator unseal "$UNSEAL_KEY_1" 2>&1 | grep -E "Unseal Progress|Sealed" || true
    vault operator unseal "$UNSEAL_KEY_2" 2>&1 | grep -E "Unseal Progress|Sealed" || true
    vault operator unseal "$UNSEAL_KEY_3" 2>&1 | grep -E "Unseal Progress|Sealed" || true
    
    log_success "Unsealed!"
fi

SEAL_STATUS=$(vault status -format=json 2>/dev/null | jq -r '.sealed' 2>/dev/null || echo "true")
if [ "$SEAL_STATUS" != "false" ]; then
    log_error "Failed to unseal!"
    vault status
    exit 1
fi

# ==================== LOGIN ====================
log_info "Authenticating..."

vault login "$ROOT_TOKEN" >/dev/null 2>&1 || { log_error "Login failed"; exit 1; }
log_success "Authenticated!"

# ==================== SETUP ====================
log_info "Configuring..."

vault secrets enable -version=2 -path=secret kv 2>/dev/null || log_info " KV enabled"
vault audit enable file file_path=/vault/logs/audit.log 2>/dev/null || log_info " Audit enabled"

# ==================== SECRETS ====================
log_info "Creating secrets..."

DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
vault kv put secret/database host=postgres port=5432 name=minibank_db user=admin password=admin123 >/dev/null 2>&1

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
vault kv put secret/jwt secret="$JWT_SECRET" expires_in=1h algorithm=HS256 >/dev/null 2>&1

vault kv put secret/auth port=3001 bcrypt_rounds=12 >/dev/null 2>&1
vault kv put secret/user port=3002 >/dev/null 2>&1
vault kv put secret/transaction port=3003 >/dev/null 2>&1
vault kv put secret/blockchain port=3004 >/dev/null 2>&1

log_success "  6 secrets created"

# ==================== POLICIES ====================
log_info "Creating policies..."

cat > /tmp/auth-policy.hcl <<'EOF'
path "secret/data/database" { capabilities = ["read"] }
path "secret/data/jwt" { capabilities = ["read"] }
path "secret/data/auth" { capabilities = ["read"] }
EOF
vault policy write auth-service /tmp/auth-policy.hcl >/dev/null 2>&1

cat > /tmp/user-policy.hcl <<'EOF'
path "secret/data/database" { capabilities = ["read"] }
path "secret/data/user" { capabilities = ["read"] }
path "secret/data/jwt" { capabilities = ["read"] }
EOF
vault policy write user-service /tmp/user-policy.hcl >/dev/null 2>&1

cat > /tmp/transaction-policy.hcl <<'EOF'
path "secret/data/database" { capabilities = ["read"] }
path "secret/data/transaction" { capabilities = ["read"] }
path "secret/data/jwt" { capabilities = ["read"] }
EOF
vault policy write transaction-service /tmp/transaction-policy.hcl >/dev/null 2>&1

cat > /tmp/blockchain-policy.hcl <<'EOF'
path "secret/data/blockchain" { capabilities = ["read", "create", "update"] }
path "secret/data/wallets/*"  { capabilities = ["read", "create", "update"] }
EOF
vault policy write blockchain-service /tmp/blockchain-policy.hcl >/dev/null 2>&1

log_success "  4 policies created"

# ==================== APPROLE ====================
log_info "Setting up AppRole..."

vault auth enable approle 2>/dev/null || log_info " AppRole enabled"
mkdir -p "$APPROLE_DIR"

for service in auth user transaction blockchain; do
    vault write auth/approle/role/${service}-service \
        token_ttl=1h token_max_ttl=4h token_policies="${service}-service" \
        bind_secret_id=true secret_id_ttl=0 >/dev/null 2>&1
    
    ROLE_ID=$(vault read -field=role_id auth/approle/role/${service}-service/role-id)
    SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/${service}-service/secret-id)
    
    echo "$ROLE_ID" > "$APPROLE_DIR/${service}_role_id"
    echo "$SECRET_ID" > "$APPROLE_DIR/${service}_secret_id"
    chmod 600 "$APPROLE_DIR/${service}_role_id" "$APPROLE_DIR/${service}_secret_id"
    
    log_success "  ${service}-service"
done

# ==================== SUMMARY ====================
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}        Vault Ready!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Status:${NC}"
vault status 2>&1 | grep -E "(Initialized|Sealed|Version)" || echo "   Running"
echo ""
echo -e "${BLUE}Resources Created:${NC}"
echo "   6 secrets (database, jwt, 4 configs)"
echo "   4 policies (granular access)"
echo "   4 AppRoles (service authentication)"
echo ""
echo -e "${YELLOW}Root Token: ${ROOT_TOKEN:0:20}...${NC}"
echo -e "${YELLOW}Keys: $VAULT_KEYS_FILE${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""

# ==================== MONITOR ====================
log_info "Monitoring Vault health..."

while true; do
    if ! kill -0 $VAULT_PID 2>/dev/null; then
        log_error "Vault died!"
        exit 1
    fi
    
    # Check if still unsealed
    if ! curl -sf "$VAULT_ADDR/v1/sys/health" >/dev/null 2>&1; then
        log_warning "Vault may have sealed, checking..."
        vault status || true
    fi
    
    sleep 30
done