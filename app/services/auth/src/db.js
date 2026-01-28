const { Pool } = require('pg');
const vaultClient = require('./vault');

let pool;

async function initPool() 
{
    if (pool) return pool;
    
    console.log('Fetching database credentials from Vault...');
    const dbConfig = await vaultClient.getDatabaseConfig();
    
    pool = new Pool(dbConfig);
    
    pool.on('connect', () => 
      {
        console.log('Connected to PostgreSQL');
      });
    
    pool.on('error', (err) => 
      {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
      });
    
    return pool;
}

async function initDatabase() {
    const dbPool = await initPool();
    const client = await dbPool.connect();
    
    try 
    {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database initialized');
    } catch (error) 
    {
        console.error('Error initializing database:', error);
        throw error;
    } finally 
    {
        client.release();
    }
}

async function getPool() 
{
    return await initPool();
}

module.exports = { getPool, initDatabase };