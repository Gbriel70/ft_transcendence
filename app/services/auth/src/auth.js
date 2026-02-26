const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const client = require('prom-client');
const { getPool, initDatabase } = require('./db');
const vaultClient = require('./vault');

const app = express();
app.use(express.json());

let config;

const register = client.register;
register.setDefaultLabels({ service: process.env.SERVICE_NAME || 'auth' });
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  if (req.path === '/metrics')
  {
    return next();
  }

  const endTimer = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route && req.route.path ? `${req.baseUrl || ''}${req.route.path}` : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode
    };

    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });

  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// Helper function to create user profile in User Service after registration
async function createUserProfile(authUserId, username)
{
  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user_service:3002';

  try
  {
    const response = await fetch(`${userServiceUrl}/users`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify
      ({
        auth_user_id: authUserId,
        name: username
      })
    });

    if (!response.ok)
    {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user profile');
    }
    return await response.json();
  }catch (error)
  {
    console.error('Error creating user profile:', error.message);
    throw error;
  }
}

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

    // CREATE AUTH USER
    const result = await pool.query
    (
      'INSERT INTO user_auth (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    const user = result.rows[0];

    // CALL USER SERVICE TO CREATE PROFILE
    try
    {
      await createUserProfile(user.id, name);
    } catch (error) {
      // ROLLBACK AUTH USER IF PROFILE CREATION FAILS
      await pool.query('DELETE FROM user_auth WHERE id = $1', [user.id]);
      throw new Error('Failed to create user profile');
    }

    // GENERATE JWT TOKEN
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
    )

    res.status(201).json
    ({
      message: 'User registered successfully',
      token,
      user:
      {
        id: user.id,
        email: user.email,
        username: user.name
      }
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
    const result = await pool.query('SELECT * FROM user_auth WHERE email = $1', [email]);

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
      user:
      {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });
  } catch (error)
  {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /change-email - Change user email
app.put('/change-email', async (req, res) =>
{
  try
  {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token)
    {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const { newEmail } = req.body;

    if (!newEmail)
    {
      return res.status(400).json({ error: 'New email is required' });
    }

    const pool = await getPool();

    // Check if new email already exists
    const checkResult = await pool.query('SELECT id FROM user_auth WHERE email = $1', [newEmail]);
    if (checkResult.rows.length > 0)
    {
      return res.status(409).json({ error: 'Email already in use' });
    }

    await pool.query('UPDATE user_auth SET email = $1 WHERE id = $2', [newEmail, decoded.id]);

    res.json({ message: 'Email updated successfully' });
  } catch (error)
  {
    if (error.name === 'JsonWebTokenError')
    {
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.error('Error updating email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /change-password - Change user password
app.put('/change-password', async (req, res) =>
{
  try
  {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token)
    {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
    {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6)
    {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const pool = await getPool();
    const result = await pool.query('SELECT password_hash FROM user_auth WHERE id = $1', [decoded.id]);

    if (result.rows.length === 0)
    {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!validPassword)
    {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
    await pool.query('UPDATE user_auth SET password_hash = $1 WHERE id = $2', [hashedPassword, decoded.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error)
  {
    if (error.name === 'JsonWebTokenError')
    {
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.error('Error updating password:', error);
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
