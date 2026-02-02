#!/bin/bash
set -e

echo "INITIALIZING DATABASE WITH VAULT CREDENTIALS..."

MAX_WAIT=60
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -sf http://vault:8200/v1/sys/health >/dev/null 2>&1; then
        echo "VAULT IS READY!"
        break
    fi
    echo "WAITING FOR VAULT... ($WAITED/$MAX_WAIT)"
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "VAULT NOT READY, USING FALLBACK CREDENTIALS"
    DB_USER="minibank_user"
    DB_PASS="minibank_password"
else
    # PEAK INTO VAULT TO GET ROOT TOKEN
    VAULT_TOKEN=$(cat /vault-approle/vault-keys.env | grep VAULT_ROOT_TOKEN | cut -d'=' -f2)
    
    # SEARCH DATABASE CREDENTIALS IN VAULT
    DB_CREDS=$(curl -sf \
        -H "X-Vault-Token: $VAULT_TOKEN" \
        http://vault:8200/v1/secret/data/database | jq -r '.data.data')
    
    DB_USER=$(echo "$DB_CREDS" | jq -r '.user')
    DB_PASS=$(echo "$DB_CREDS" | jq -r '.password')
fi

# CREATE DATABASE AND USER
psql -v ON_ERROR_STOP=1 --username "postgres" --dbname "minibank_db" <<-EOSQL
    -- Criar usuário com senha do Vault
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
            CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
        END IF;
    END
    \$\$;

    -- Permissões
    GRANT ALL PRIVILEGES ON DATABASE minibank_db TO $DB_USER;
    GRANT ALL ON SCHEMA public TO $DB_USER;

    -- Criar tabelas
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        balance DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        from_user_id INTEGER REFERENCES users(id),
        to_user_id INTEGER REFERENCES users(id),
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Índices
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_user_id);

    -- Permissões nas tabelas
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

    \echo 'Database initialized with Vault credentials!'
EOSQL