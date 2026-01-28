#!/bin/sh

set -e

echo "Starting Auth Service..."

# READ VAULT CREDENTIALS FROM SHARED VOLUME
if [ -f /vault-keys/vault-keys.env ]; then
    echo "Loading Vault credentials from shared volume..."
    . /vault-keys/vault-keys.env
    export VAULT_TOKEN="$VAULT_ROOT_TOKEN"
    echo "Vault token loaded (${VAULT_TOKEN:0:20}...)"
else
    echo "Vault keys file not found. Using environment variable VAULT_TOKEN."
fi

# Check if token is available
if [ -z "$VAULT_TOKEN" ]; then
    echo "WARNING: VAULT_TOKEN not set! Service will use fallback credentials."
fi

# Start application
exec npm start