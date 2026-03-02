#!/bin/sh
set -e

echo "=============================="
echo "  Hardhat Node Starting..."
echo "=============================="

npx hardhat node --hostname 0.0.0.0 &
HARDHAT_PID=$!

echo "Hardhat PID: $HARDHAT_PID"
echo "Waiting for node to be ready..."

MAX_RETRIES=30
COUNT=0
until nc -z localhost 8545; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "Hardhat node failed to start!"
    exit 1
  fi
  echo "Waiting for port 8545... (${COUNT}/${MAX_RETRIES})"
  sleep 2
done

echo "Hardhat node is ready!"

# Compile
echo ""
echo "Compiling contracts..."
npx hardhat compile --force
echo "Compile exit code: $?"

# Debug: mostrar onde os artifacts foram gerados
echo "Artifacts directory contents:"
find /app/artifacts -type f 2>/dev/null || echo "  /app/artifacts is empty!"

# Verify artifact - o contrato se chama Minibank.sol (com b minusculo!)
# Checar os dois paths possiveis
if [ -f "/app/artifacts/contracts/MiniBank.sol/MiniBank.json" ]; then
  echo "MiniBank.json found at MiniBank.sol/MiniBank.json"
elif [ -f "/app/artifacts/contracts/Minibank.sol/MiniBank.json" ]; then
  echo "MiniBank.json found at Minibank.sol/MiniBank.json"
else
  echo "ERROR: MiniBank.json not found after compile!"
  echo "Contract files in /app/contracts:"
  ls -la /app/contracts/ 2>/dev/null || echo "  /app/contracts is empty!"
  exit 1
fi

# Deploy
echo ""
echo "Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost
echo "Deploy exit code: $?"

echo ""
echo "=============================="
echo "  Hardhat ready!"
echo "=============================="

wait $HARDHAT_PID