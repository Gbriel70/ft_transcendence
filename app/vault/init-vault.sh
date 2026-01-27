#!/bin/sh

set -e

echo "⏳ Waiting for Vault to be ready..."
sleep 5

# Verificar se Vault está pronto
until vault status 2>/dev/null; do
  echo "Waiting for Vault..."
  sleep 2
done

echo "✅ Vault is ready!"

# Criar secrets para cada serviço
echo "📝 Creating secrets..."

# Auth Service
vault kv put secret/auth \
  jwt_secret="your-super-secret-jwt-key-change-in-production" \
  postgres_host="postgres" \
  postgres_port="5432" \
  postgres_user="admin" \
  postgres_password="admin123" \
  postgres_db="transcendence"

# User Service
vault kv put secret/user \
  postgres_host="postgres" \
  postgres_port="5432" \
  postgres_user="admin" \
  postgres_password="admin123" \
  postgres_db="transcendence"

# Transition Service
vault kv put secret/transition \
  postgres_host="postgres" \
  postgres_port="5432" \
  postgres_user="admin" \
  postgres_password="admin123" \
  postgres_db="transcendence"

# Blockchain Service
vault kv put secret/blockchain \
  network_id="1337" \
  gas_limit="3000000"

echo "✅ All secrets created!"