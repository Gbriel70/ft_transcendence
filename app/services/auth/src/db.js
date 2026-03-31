const { Pool } = require('pg');
const vaultClient = require('./vault');

let pool;

// WAIT FOR POSTGRES TO BE REACHABLE OVER TCP
// (during docker-entrypoint-initdb.d execution postgres only listens on
//  a Unix socket, so pg_isready passes but TCP connections are refused)
async function waitForPostgres(host, port, user, password, maxAttempts = 30, delayMs = 3000)
{
    for (let attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            const testPool = new Pool({ host, port, database: 'postgres', user, password, connectionTimeoutMillis: 3000 });
            const client = await testPool.connect();
            client.release();
            await testPool.end();
            return;
        } catch (err)
        {
            console.log(`Waiting for PostgreSQL TCP (attempt ${attempt}/${maxAttempts}): ${err.message}`);
            if (attempt === maxAttempts) { throw new Error(`PostgreSQL not reachable after ${maxAttempts} attempts`); }
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
}

// CREATE CONNECTION POOL
async function createPool() 
{
    if (pool) {return pool;}

    console.log('Creating PostgreSQL connection pool...');

    // SEARCH CONFIG FROM VAULT
    const config = await vaultClient.getServiceConfig();
    const { database } = config;

    // Wait until postgres TCP port is accepting connections
    await waitForPostgres(database.host, database.port, database.user, database.password);

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
        connectionTimeoutMillis: 5000,
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
        CREATE TABLE IF NOT EXISTS user_auth (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_user_auth_email ON user_auth(email);

        ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255);
        ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE;

        CREATE TABLE IF NOT EXISTS gdpr_delete_requests (
            id SERIAL PRIMARY KEY,
            auth_user_id INTEGER REFERENCES user_auth(id) ON DELETE CASCADE,
            token VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_gdpr_token ON gdpr_delete_requests(token);
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