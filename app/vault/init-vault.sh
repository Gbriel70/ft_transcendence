#!/bin/sh

set -e

echo "Starting Vault Server..."

vault server -config=/vault/config/vault-config.hcl &

sleep 5

export VAULT_ADDR='http://127.0.0.1:8200'

if vault status 2>/dev/null | grep -q "Initialized.*true"; then
    echo "Vault already initialized"
else
    echo "Initializing Vault..."

    vault operator init \
        -key-shares=1 \
        -key-threshold=1 \
        -format=json > /vault/data/init-keys.json
    
    # EXTRACT KEYS
    UNSEAL_KEY=$(awk -F'"' '/"unseal_keys_b64"/ {getline; print $2}' /vault/data/init-keys.json)
    ROOT_TOKEN=$(awk -F'"' '/"root_token"/ {print $4}' /vault/data/init-keys.json)
    
    echo "Vault initialized!"
    
    # SAVE KEYS
    echo "VAULT_UNSEAL_KEY=$UNSEAL_KEY" > /vault/data/vault-keys.env
    echo "VAULT_ROOT_TOKEN=$ROOT_TOKEN" >> /vault/data/vault-keys.env
    chmod 600 /vault/data/vault-keys.env
    
    echo "Keys saved to /vault/data/vault-keys.env"
fi

echo "Unsealing Vault..."
if [ -f /vault/data/vault-keys.env ]; then
    . /vault/data/vault-keys.env
    
    if [ -z "$VAULT_UNSEAL_KEY" ]; then
        echo "ERROR: VAULT_UNSEAL_KEY is empty!"
        exit 1
    fi
    
    vault operator unseal "$VAULT_UNSEAL_KEY"
    echo "Vault unsealed!"
    
    # LOGIN ROOT TOKEN
    vault login "$VAULT_ROOT_TOKEN" >/dev/null 2>&1
    
    # ENABLE KV SECRETS ENGINE AND CREATE SECRETS
    vault secrets enable -version=2 -path=secret kv 2>/dev/null || echo "KV engine already enabled"
    
    echo "Creating initial secrets..."
    
    # Secret: database
    vault kv put secret/database \
        host=postgres \
        port=5432 \
        name=minibank_db \
        user=admin \
        password=admin123 2>/dev/null || true
    
    # Secret: jwt (WITH VALIDATION)
    echo "Generating JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Validate that the secret was generated
    if [ -z "$JWT_SECRET" ]; then
        echo "ERROR: Failed to generate JWT secret!"
        exit 1
    fi
    
    echo "JWT Secret generated"
    
    vault kv put secret/jwt \
        secret="$JWT_SECRET" \
        expires_in=86400 2>/dev/null || true
    
    # Validate that the secret was saved correctly
    SAVED_SECRET=$(vault kv get -format=json secret/jwt | awk -F'"' '/"secret"/ {print $4}')
    if [ -z "$SAVED_SECRET" ]; then
        echo "ERROR: JWT secret was not saved correctly!"
        exit 1
    fi
    echo "JWT secret saved successfully"
    
    # Secret: auth
    vault kv put secret/auth \
        port=3001 \
        bcrypt_rounds=12
    
    # Secret: user
    vault kv put secret/user \
        port=3002
    
    # Secret: transaction
    vault kv put secret/transaction \
        port=3003
    
    # Secret: blockchain
    vault kv put secret/blockchain \
        port=3004 \
        network=ethereum
    
    echo "All secrets created successfully!"
    
    # List created secrets
    echo ""
    echo "Created secrets:"
    vault kv list secret/ | grep -v "^Keys" | grep -v "^----" | while read secret; do
        echo "   - $secret"
    done
    
else
    echo "ERROR: /vault/data/vault-keys.env not found!"
    exit 1
fi

echo ""
echo "Vault is ready!"
echo "Vault UI: http://localhost:8200/ui"
echo "Root Token: ${ROOT_TOKEN:0:30}... (see /vault/data/vault-keys.env)"
echo ""

tail -f /dev/null