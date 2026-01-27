#!/bin/sh
set -e

apk add --no-cache jq >/dev/null 2>&1 || true

export VAULT_ADDR="http://vault:8200"

echo "Waiting for Vault..."
until vault status >/dev/null 2>&1; do
  sleep 2
done

if [ ! -f /vault/init/.initialized ]; then
  echo "Initializing Vault..."
  vault operator init -format=json > /vault/init/init.json

  UNSEAL_KEY=$(cat /vault/init/init.json | jq -r '.unseal_keys_b64[0]')
  ROOT_TOKEN=$(cat /vault/init/init.json | jq -r '.root_token')

  echo "$UNSEAL_KEY" > /vault/init/unseal_key
  echo "$ROOT_TOKEN" > /vault/init/root_token
  touch /vault/init/.initialized
else
  UNSEAL_KEY=$(cat /vault/init/unseal_key)
  ROOT_TOKEN=$(cat /vault/init/root_token)
fi

vault operator unseal "$UNSEAL_KEY"
vault login "$ROOT_TOKEN" >/dev/null

vault secrets enable -path=secret kv-v2 >/dev/null 2>&1 || true
vault auth enable approle >/dev/null 2>&1 || true

vault policy write auth /vault/policies/auth.hcl
vault policy write user /vault/policies/user.hcl
vault policy write transition /vault/policies/transition.hcl
vault policy write blockchain /vault/policies/blockchain.hcl

vault write auth/approle/role/auth token_policies="auth" >/dev/null
vault write auth/approle/role/user token_policies="user" >/dev/null
vault write auth/approle/role/transition token_policies="transition" >/dev/null
vault write auth/approle/role/blockchain token_policies="blockchain" >/dev/null

vault read -field=role_id auth/approle/role/auth/role-id > /vault/init/role_id_auth
vault write -f -field=secret_id auth/approle/role/auth/secret-id > /vault/init/secret_id_auth

vault read -field=role_id auth/approle/role/user/role-id > /vault/init/role_id_user
vault write -f -field=secret_id auth/approle/role/user/secret-id > /vault/init/secret_id_user

vault read -field=role_id auth/approle/role/transition/role-id > /vault/init/role_id_transition
vault write -f -field=secret_id auth/approle/role/transition/secret-id > /vault/init/secret_id_transition

vault read -field=role_id auth/approle/role/blockchain/role-id > /vault/init/role_id_blockchain
vault write -f -field=secret_id auth/approle/role/blockchain/secret-id > /vault/init/secret_id_blockchain

vault kv put secret/auth db_user=admin db_password=admin123 jwt_secret=jwt_secret_key
vault kv put secret/user db_user=admin db_password=admin123
vault kv put secret/transition db_user=admin db_password=admin123
vault kv put secret/blockchain db_user=admin db_password=admin123
