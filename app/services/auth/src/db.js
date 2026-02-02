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

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_user_id);
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