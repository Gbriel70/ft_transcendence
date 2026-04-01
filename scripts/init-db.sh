#!/bin/bash
set -e

echo "INITIALIZING DATABASE WITH VAULT CREDENTIALS..."

DB_USER="${POSTGRES_USER:-}"
DB_PASS="${POSTGRES_PASSWORD:-}"

if [ -z "$DB_USER" ] || [ -z "$DB_PASS" ]; then
    echo "POSTGRES_USER or POSTGRES_PASSWORD is empty; Vault bootstrap did not inject credentials"
    exit 1
fi

# CREATE DATABASE AND USER
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER:-admin}" --dbname "minibank_db" <<-EOSQL
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
    CREATE TABLE IF NOT EXISTS user_auth (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        auth_user_id INTEGER REFERENCES user_auth(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        profile_picture TEXT,
        wallet_address VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Migrations: add columns if they don't exist yet
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_picture TEXT;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- GDPR deletion requests table
    CREATE TABLE IF NOT EXISTS gdpr_delete_requests (
        id SERIAL PRIMARY KEY,
        auth_user_id INTEGER REFERENCES user_auth(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_gdpr_token ON gdpr_delete_requests(token);

    -- Índices
    CREATE INDEX IF NOT EXISTS idx_user_auth_email ON user_auth(email);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);

    -- Permissões nas tabelas
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

    \echo 'Database initialized with Vault credentials!'
EOSQL