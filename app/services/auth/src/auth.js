const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool, initDatabase } = require('./db');
const vaultClient = require('./vault');

const app = express();
app.use(express.json());

let config;

// Register
app.post('/register', async (req, res) => 
{
  try 
  {
    const { email, password, name } = req.body;

    if (!email || !password || !name)
    {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pool = await getPool();
    
    // USE BCRYPT CONFIG FROM VAULT
    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

    const result = await pool.query
    (
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    res.status(201).json
    ({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (error) 
  {
    if (error.code === '23505') 
    {
      return res.status(409).json({ error: 'Email already in use' });
    }
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/login', async (req, res) => 
{
  try 
  {
    const { email, password } = req.body;

    if (!email || !password) 
    {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const pool = await getPool();
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) 
    {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) 
    {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // USE JWT CONFIG FROM VAULT
    const token = jwt.sign
    (
      {
        id: user.id,
        email: user.email,
      },
      config.jwt.secret,
      { 
        expiresIn: config.jwt.expiresIn,
        algorithm: config.jwt.algorithm
      }
    );

    res.json
    ({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balance: user.balance
      }
    });
  } catch (error) 
  {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bootstrap
async function bootstrap() {
  try {
    console.log('Starting Auth Service...');
    
    // LOAD CONFIG FROM VAULT
    config = await vaultClient.getServiceConfig();
    
    console.log('Configuration loaded:');
    console.log(`   - Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
    console.log(`   - JWT Algorithm: ${config.jwt.algorithm}`);
    console.log(`   - JWT Expires: ${config.jwt.expiresIn}`);
    console.log(`   - Bcrypt Rounds: ${config.bcryptRounds}`);
    
    // Initialize database
    await initDatabase();
    
    // Start server
    const PORT = config.port;
    app.listen(PORT, () => 
    {
      console.log(`Auth service ready on port ${PORT}`);
    });
  } catch (error) 
  {
    console.error('Failed to start auth service:', error);
    process.exit(1);
  }
}

bootstrap();