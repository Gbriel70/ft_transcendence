const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool, initDatabase } = require('./db');
const vaultClient = require('./vault');

const app = express();
app.use(express.json());

let config;

//Health check endpoint
app.get('/health', (req, res) => 
  {
    res.json({status: 'ok'});
  });


// Registration endpoint
app.post('/register', async (req, res) => 
{
  try
  {
    const {email, password, name} = req.body;

    if (!email || !password || !name) 
      {
        return res.status(400).json({error: 'Email and password and name are required'});
      }
    const pool = await getPool();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    res.status(201).json(
      {
        message: 'User registered successfully',
        user: result.rows[0]
      });
  } catch (error)
  {
    if (error.code === '23505') 
      {
        return res.status(409).json({error: 'Email already in use'});
      }
    console.error('Error during registration:', error);
    res.status(500).json({error: 'Internal server error'});
  }
});


// Login endpoint
app.post('/login', async (req, res) => 
{
  try
  {
    const {email, password} = req.body;
    
    if (!email || !password) 
      {
        return res.status(400).json({error: 'Email and password are required'});
      }
    const pool = await getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0)
      {
        return res.status(401).json({error: 'Invalid email or password'});
      }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) 
      {
        return res.status(401).json({error: 'Invalid email or password'});
      }
    
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      config.jwtSecret, {expiresIn: config.jwtExpiresIn}
    );

    res.json({
      message: 'Login successful',
      token,
      user: 
      {
        id: user.id,
        email: user.email,
        name:user.name
      }
    });
  }catch (error)
  {
    console.error('Error during login:', error);
    res.status(500).json({error: 'Internal server error'});
  }
});

// BOOTSTRAP ASSÍNCRONO
async function bootstrap() {
  try {
    console.log('Starting auth service...');
    
    // LOAD CONFIG FROM VAULT
    config = await vaultClient.getServiceConfig();
    
    // INIT DATABASE
    await initDatabase();
    
    // INIT SERVER
    const PORT = config?.port || process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Auth service ready on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start auth service:', error);
    process.exit(1);
  }
}

bootstrap();