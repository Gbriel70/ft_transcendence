-- Criar schemas separados para cada serviço
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS transactions;
CREATE SCHEMA IF NOT EXISTS blockchain;

-- Tabelas do serviço AUTH
CREATE TABLE IF NOT EXISTS auth.credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth.sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth.credentials(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabelas do serviço USER
CREATE TABLE IF NOT EXISTS users.profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabelas do serviço TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions.transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabelas do serviço BLOCKCHAIN
CREATE TABLE IF NOT EXISTS blockchain.blocks (
    id SERIAL PRIMARY KEY,
    block_index INTEGER UNIQUE NOT NULL,
    previous_hash VARCHAR(256),
    hash VARCHAR(256) NOT NULL,
    data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_sessions_token ON auth.sessions(token);
CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_profiles_user_id ON users.profiles(user_id);
CREATE INDEX idx_transactions_user_id ON transactions.transactions(user_id);
CREATE INDEX idx_blocks_index ON blockchain.blocks(block_index);