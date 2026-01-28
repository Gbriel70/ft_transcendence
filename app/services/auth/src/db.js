const { Pool } = require('pg');
require('dotenv').config();

const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.warn(`Warning: Environment variable ${varName} is not set. Using default value.`);
    }
});

const pool = new Pool(
    {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

pool.on('connect', () => {
    console.log('Connected to the database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = { pool };