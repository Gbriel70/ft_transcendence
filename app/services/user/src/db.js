const { Pool } = require('pg');
const vaultClient = require('./vault');

let pool;

// CREATE CONNECTION POOL
async function createPool() 
{
    if (pool) {return pool;}

    console.log('Creating PostgreSQL connection pool...');

    // SEARCH CONFIG FROM VAULT
    const config = await vaultClient.getServiceConfig();
    const { database } = config;

    pool = new Pool
    ({
        host: database.host,
        port: database.port,
        database: database.name,
        user: database.user,
        password: database.password,
        
        // Pool settings
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

    // Event handlers
    pool.on('connect', () => {console.log('New database connection established');});
    pool.on('error', (err) => {console.error('Unexpected database error:', err);});

    // Test connection
    try 
    {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL');
        client.release();
    } catch (error) 
    {
        console.error('Database connection failed:', error.message);
        throw error;
    }

    return pool;
}

// GET CONNECTION POOL IF NOT EXISTS CREATE IT
async function getPool() 
{
    if (!pool) {await createPool();}
    return pool;
}

// INITIALIZE DATABASE SCHEMA
async function initDatabase() 
{
    console.log('Initializing database schema...');

    const pool = await getPool();

    const schema = `
        CREATE TABLE IF NOT EXISTS user_profiles (
            id SERIAL PRIMARY KEY,
            auth_user_id INTEGER REFERENCES user_auth(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            profile_picture TEXT,
            wallet_address VARCHAR(255) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);
    `;

    try 
    {
        await pool.query(schema);
        console.log('Database schema ready');
    } catch (error) 
    {
        console.error('Schema initialization failed:', error.message);
        throw error;
    }
}

// CLOSE CONNECTION POOL
async function closePool() 
{
    if (pool) 
    {
        await pool.end();
        pool = null;
        console.log('Database pool closed');
    }
}

module.exports = 
{
    getPool,
    initDatabase,
    closePool
};