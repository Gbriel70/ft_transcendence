const { Pool } = require('pg');
const { getSecrets } = require('./vault');

let pool;

async function initDatabase() {
  try {
    console.log('🔄 Initializing database connection...');
    
    // Buscar credenciais do Vault
    const secrets = await getSecrets('secret/auth');
    
    pool = new Pool({
      host: secrets.postgres_host,
      port: parseInt(secrets.postgres_port),
      user: secrets.postgres_user,
      password: secrets.postgres_password,
      database: secrets.postgres_db,
    });

    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to the database');

    // Criar tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDatabase() first.');
  }
  return pool;
}

module.exports = { initDatabase, getPool };