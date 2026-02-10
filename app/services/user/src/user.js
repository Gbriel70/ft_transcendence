const express = require('express');
const jwt = require('jsonwebtoken');
const { getPool, initDatabase } = require('./db');
const vaultClient = require('./vault');

const app = express();
app.use(express.json());

let config;

// Middleware to verify JWT
async function authenticateToken(req, res, next) 
{
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) 
  {
    return res.status(401).json({ error: 'Access token required' });
  }

  try 
  {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) 
  {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// POST /users - Create user profile (called by auth service or after registration)
app.post('/users', async (req, res) => 
{
  try 
  {
    const { auth_user_id, name} = req.body;

    if (!auth_user_id || !name) 
    {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pool = await getPool();
    
    const result = await pool.query
    (
      'INSERT INTO user_profiles (auth_user_id, name) VALUES ($1, $2) RETURNING *',
      [auth_user_id, name]
    );

    res.status(201).json
    ({
      message: 'User profile created successfully',
      profile: result.rows[0]
    });
  } catch (error) 
  {
    if (error.code === '23505') 
    {
      return res.status(409).json({ error: 'Username already in use' });
    }
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/me - Get current user profile
app.get('/users/me', authenticateToken, async (req, res) => 
{
  try 
  {
    const authUserId = req.user.id;
    
    const pool = await getPool();
    const result = await pool.query
    (
      'SELECT * FROM user_profiles WHERE auth_user_id = $1',
      [authUserId]
    );

    if (result.rows.length === 0) 
    {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) 
  {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/:id - Get user by ID
app.get('/users/:id', async (req, res) => 
{
  try 
  {
    const userId = req.params.id;
    const pool = await getPool();
    
    const result = await pool.query
    (
      'SELECT id, auth_user_id, name, wallet_address, created_at FROM user_profiles WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) 
    {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) 
  {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/by-username/:username - Get user by username
app.get('/users/by-username/:username', async (req, res) => 
{
  try 
  {
    const { username } = req.params;
    const pool = await getPool();
    
    const result = await pool.query
    (
      'SELECT id, auth_user_id, name, wallet_address, created_at FROM user_profiles WHERE name = $1',
      [username]
    );

    if (result.rows.length === 0) 
    {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) 
  {
    console.error('Error fetching user by username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/me/wallet - Create wallet for current user (placeholder)
app.post('/users/me/wallet', authenticateToken, async (req, res) => 
{
  try 
  {
    const authUserId = req.user.id;
    
    // Check if user already has a wallet
    const pool = await getPool();
    const checkResult = await pool.query
    (
      'SELECT wallet_address FROM user_profiles WHERE auth_user_id = $1',
      [authUserId]
    );

    if (checkResult.rows.length === 0) 
    {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (checkResult.rows[0].wallet_address) 
    {
      return res.status(409).json({ error: 'User already has a wallet' });
    }

    //###############################################################################################
    // TODO: Call blockchain_service to create wallet and get address, then save to user_profiles 
    // ##############################################################################################
    
    res.status(501).json
    ({
      message: 'Wallet creation not yet implemented',
      note: 'This will be implemented when blockchain_service is ready'
    });
  } catch (error) 
  {
    console.error('Error creating wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/:id/balance - Get user balance
app.get('/users/:id/balance', async (req, res) => 
{
  try 
  {
    const userId = req.params.id;
    const pool = await getPool();
    
    const result = await pool.query
    (
      'SELECT balance, wallet_address FROM user_profiles WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) 
    {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) 
  {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bootstrap
async function bootstrap() 
{
  try 
  {
    console.log('Starting User Service...');
    
    // LOAD CONFIG FROM VAULT
    config = await vaultClient.getServiceConfig();
    
    console.log('Configuration loaded:');
    console.log(`   - Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
    console.log(`   - JWT Algorithm: ${config.jwt.algorithm}`);
    
    // Initialize database
    await initDatabase();
    
    // Start server
    const PORT = config.port;
    app.listen(PORT, () => 
    {
      console.log(`User service ready on port ${PORT}`);
    });
  } catch (error) 
  {
    console.error('Failed to start user service:', error);
    process.exit(1);
  }
}

bootstrap();