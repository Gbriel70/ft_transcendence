#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

print_header() { echo -e "\n${BLUE}==============================${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}==============================${NC}"; }
pass() { echo -e "${GREEN}  ✅ $1${NC}"; PASS=$((PASS + 1)); }
fail() { echo -e "${RED}  ❌ $1${NC}"; FAIL=$((FAIL + 1)); }
info() { echo -e "${YELLOW}  ℹ  $1${NC}"; }

# ==================== 1. CONTAINERS ====================
print_header "1. Checking Containers"

for container in vault postgres hardhat blockchain_service; do
    STATUS=$(docker inspect --format='{{.State.Status}}' $container 2>/dev/null)
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null)

    if [ "$STATUS" = "running" ]; then
        if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "" ]; then
            pass "$container is running"
        else
            fail "$container is running but health=$HEALTH"
        fi
    else
        fail "$container is NOT running (status=$STATUS)"
    fi
done

# ==================== 2. HARDHAT NODE ====================
print_header "2. Checking Hardhat Node"

# Check RPC
RESPONSE=$(curl -sf -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null)

if echo "$RESPONSE" | grep -q "result"; then
    BLOCK=$(echo "$RESPONSE" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    pass "Hardhat RPC responding (block: $BLOCK)"
else
    fail "Hardhat RPC not responding"
fi

# Check chain ID
CHAIN=$(curl -sf -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' 2>/dev/null \
    | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

if [ "$CHAIN" = "0x539" ]; then
    pass "Chain ID is 1337 (0x539)"
else
    fail "Wrong chain ID: $CHAIN (expected 0x539)"
fi

# Check accounts
ACCOUNTS=$(curl -sf -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}' 2>/dev/null)

ACCOUNT_COUNT=$(echo "$ACCOUNTS" | grep -o "0x[a-fA-F0-9]*" | wc -l)
if [ "$ACCOUNT_COUNT" -ge 20 ]; then
    pass "Hardhat accounts loaded ($ACCOUNT_COUNT accounts)"
else
    fail "Expected 20 accounts, got $ACCOUNT_COUNT"
fi

# ==================== 3. CONTRACT DEPLOYED ====================
print_header "3. Checking Contract Deployment"

# Check deployment.json inside container
DEPLOYMENT=$(docker exec hardhat cat /app/deployment.json 2>/dev/null)

if [ ! -z "$DEPLOYMENT" ]; then
    CONTRACT_ADDR=$(echo "$DEPLOYMENT" | grep -o '"contractAddress": "[^"]*"' | cut -d'"' -f4)
    pass "deployment.json exists"
    info "Contract address: $CONTRACT_ADDR"

    # Check contract has code on chain
    CODE=$(curl -sf -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$CONTRACT_ADDR\",\"latest\"],\"id\":1}" 2>/dev/null \
        | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

    if [ "$CODE" != "0x" ] && [ ! -z "$CODE" ]; then
        pass "Contract code exists on chain"
    else
        fail "No contract code at $CONTRACT_ADDR"
    fi
else
    fail "deployment.json not found in hardhat container"
fi

# Check artifacts
ARTIFACT=$(docker exec hardhat test -f /app/artifacts/contracts/MiniBank.sol/MiniBank.json 2>/dev/null && echo "ok")
if [ "$ARTIFACT" = "ok" ]; then
    pass "MiniBank.json artifact exists"
else
    fail "MiniBank.json artifact NOT found"
fi

# ==================== 4. VAULT ====================
print_header "4. Checking Vault"

# Check Vault health
VAULT_HEALTH=$(curl -sf http://localhost:8200/v1/sys/health 2>/dev/null)
if echo "$VAULT_HEALTH" | grep -q "initialized"; then
    pass "Vault is healthy"
else
    fail "Vault not responding"
fi

# Check contract_address in Vault
CONTRACT_IN_VAULT=$(docker exec vault vault kv get -field=contract_address secret/blockchain 2>/dev/null)
if [ ! -z "$CONTRACT_IN_VAULT" ]; then
    pass "contract_address found in Vault"
    info "Vault contract address: $CONTRACT_IN_VAULT"

    # Compare with deployment.json
    if [ "$CONTRACT_IN_VAULT" = "$CONTRACT_ADDR" ]; then
        pass "Vault address matches deployment.json"
    else
        fail "Vault address MISMATCH! Vault=$CONTRACT_IN_VAULT Deploy=$CONTRACT_ADDR"
    fi
else
    fail "contract_address NOT found in Vault"
fi


# ==================== 5. FUNCTIONAL TEST ====================
print_header "5. Functional Test (Create Wallet)"

# Create wallet for test user
info "Creating wallet for test user (id=9999)..."
CREATE_RES=$(curl -sf -X POST http://localhost:3004/wallets \
    -H "Content-Type: application/json" \
    -d '{"user_id": 9999}' 2>/dev/null)

if echo "$CREATE_RES" | grep -q "wallet_address"; then
    WALLET=$(echo "$CREATE_RES" | grep -o '"wallet_address":"[^"]*"' | cut -d'"' -f4)
    TX=$(echo "$CREATE_RES" | grep -o '"tx_hash":"[^"]*"' | cut -d'"' -f4)
    pass "Wallet created successfully"
    info "Wallet address : $WALLET"
    info "TX hash        : $TX"

    # Get wallet back
    GET_RES=$(curl -sf http://localhost:3004/wallets/9999 2>/dev/null)
    if echo "$GET_RES" | grep -q "$WALLET"; then
        pass "GET /wallets/9999 returns correct address"
    else
        fail "GET /wallets/9999 returned wrong data: $GET_RES"
    fi

    # Check balance
    BAL_RES=$(curl -sf "http://localhost:3004/balances/$WALLET" 2>/dev/null)
    if echo "$BAL_RES" | grep -q "balance"; then
        BALANCE=$(echo "$BAL_RES" | grep -o '"balance":"[^"]*"' | cut -d'"' -f4)
        pass "GET /balances returns balance: $BALANCE ETH"
    else
        fail "GET /balances failed: $BAL_RES"
    fi
else
    fail "Failed to create wallet: $CREATE_RES"
fi

# ==================== 7. LOGS ====================
print_header "7. Recent Logs"

echo ""
info "--- Hardhat (last 5 lines) ---"
docker logs --tail 5 hardhat 2>&1

echo ""
info "--- Blockchain Service (last 5 lines) ---"
docker logs --tail 5 blockchain_service 2>&1

# ==================== SUMMARY ====================
print_header "Summary"

echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}  All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "${RED}  Some tests failed! Check logs above.${NC}"
    exit 1
fi