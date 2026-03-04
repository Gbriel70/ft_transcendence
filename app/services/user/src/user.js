const express = require('express');
const jwt = require('jsonwebtoken');
const client = require('prom-client');
const { getPool, initDatabase } = require('./db');
const vaultClient = require('./vault');

const app = express();
app.use(express.json({ limit: '10mb' }));

let config;

// ─── Prometheus ───────────────────────────────────────────────────────────────

const register = client.register;
register.setDefaultLabels({ service: process.env.SERVICE_NAME || 'user' });
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
  if (req.path === '/metrics') return next();

  const endTimer = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route && req.route.path ? `${req.baseUrl || ''}${req.route.path}` : req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });

  next();
});

// ─── CORREÇÃO 1: Guard — rejeita requisições antes do bootstrap terminar ──────

app.use((req, res, next) => {
  if (!config && req.path !== '/health' && req.path !== '/metrics') {
    return res.status(503).json({ error: 'Service starting up, try again shortly' });
  }
  next();
});

// ─── Metrics & Health ─────────────────────────────────────────────────────────

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user' });
});

// ─── CORREÇÃO 2: Middleware para chamadas internas (Auth Service → User Service)

function requireInternalSecret(req, res, next) {
  const secret = req.headers['x-internal-secret'];

  if (!secret || secret !== config.internalSecret) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// ─── Middleware JWT ───────────────────────────────────────────────────────────

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  }
  catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /users - Chamado apenas pelo Auth Service (protegido pelo internal secret)
app.post('/users', requireInternalSecret, async (req, res) => {
  try {
    const { auth_user_id, name } = req.body;

    if (!auth_user_id || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pool = await getPool();

    const result = await pool.query
      (
        'INSERT INTO user_profiles (auth_user_id, name) VALUES ($1, $2) RETURNING *',
        [auth_user_id, name]
      );

    const profile = result.rows[0];

    // Automatically create blockchain wallet for the new user
    try {
      const BLOCKCHAIN_URL = process.env.BLOCKCHAIN_URL || 'http://blockchain_service:3004';
      console.log(`Auto-creating blockchain wallet for new user profile ${profile.id}...`);

      const blockchainRes = await fetch(`${BLOCKCHAIN_URL}/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: profile.id })
      });

      if (blockchainRes.ok) {
        const blockchainData = await blockchainRes.json();
        const walletAddress = blockchainData.wallet_address;

        await pool.query(
          'UPDATE user_profiles SET wallet_address = $1 WHERE id = $2',
          [walletAddress, profile.id]
        );

        profile.wallet_address = walletAddress;
        console.log(`Wallet auto-created and saved: ${walletAddress}`);
      } else {
        const errBody = await blockchainRes.json().catch(() => ({}));
        console.error('Failed to auto-create wallet (non-fatal):', errBody);
      }
    } catch (walletError) {
      // Non-fatal: profile was created, wallet can be created later
      console.error('Error auto-creating wallet (non-fatal):', walletError.message);
    }

    res.status(201).json
      ({
        message: 'User profile created successfully',
        profile
      });
  }
  catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username already in use' });
    }
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/me - Perfil do usuário autenticado
app.get('/users/me', authenticateToken, async (req, res) => {
  try {
    const authUserId = req.user.id;
    const pool = await getPool();

    const result = await pool.query
      (
        'SELECT * FROM user_profiles WHERE auth_user_id = $1',
        [authUserId]
      );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  }
  catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/by-username/:username - Buscar usuário por username
app.get('/users/by-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const pool = await getPool();

    const result = await pool.query
      (
        'SELECT id, auth_user_id, name, wallet_address, created_at FROM user_profiles WHERE name = $1',
        [username]
      );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  }
  catch (error) {
    console.error('Error fetching user by username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/by-email/:email - Buscar usuário por email
app.get('/users/by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const pool = await getPool();

    const result = await pool.query
      (
        'SELECT up.id, up.auth_user_id, up.name, up.wallet_address, up.created_at FROM user_profiles up JOIN user_auth ua ON up.auth_user_id = ua.id WHERE ua.email = $1',
        [email]
      );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  }
  catch (error) {
    console.error('Error fetching user by email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /users/:id - Buscar usuário por ID
app.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const pool = await getPool();

    const result = await pool.query
      (
        'SELECT id, auth_user_id, name, wallet_address, created_at FROM user_profiles WHERE id = $1',
        [userId]
      );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  }
  catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/me/wallet - Criar wallet para o usuário autenticado
app.post('/users/me/wallet', authenticateToken, async (req, res) => {
  try {
    const authUserId = req.user.id;
    const pool = await getPool();

    const checkResult = await pool.query
      (
        'SELECT id, wallet_address FROM user_profiles WHERE auth_user_id = $1',
        [authUserId]
      );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (checkResult.rows[0].wallet_address) {
      return res.status(409).json({ error: 'User already has a wallet' });
    }

    const profileId = checkResult.rows[0].id;
    const BLOCKCHAIN_URL = process.env.BLOCKCHAIN_URL || 'http://blockchain_service:3004';

    console.log(`Calling blockchain_service to create wallet for user ${profileId}...`);

    const blockchainRes = await fetch(`${BLOCKCHAIN_URL}/wallets`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: profileId })
      });

    if (!blockchainRes.ok) {
      const errBody = await blockchainRes.json().catch(() => ({}));
      console.error('blockchain_service error:', errBody);
      return res.status(blockchainRes.status).json
        ({
          error: errBody.error || 'Failed to create wallet on blockchain'
        });
    }

    const blockchainData = await blockchainRes.json();
    const walletAddress = blockchainData.wallet_address;

    const updateResult = await pool.query
      (
        'UPDATE user_profiles SET wallet_address = $1 WHERE auth_user_id = $2 RETURNING *',
        [walletAddress, authUserId]
      );

    console.log(`Wallet created and saved: ${walletAddress}`);

    res.status(201).json
      ({
        message: 'Wallet created successfully',
        wallet_address: walletAddress,
        tx_hash: blockchainData.tx_hash,
        profile: updateResult.rows[0]
      });
  }
  catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/:id/balance - CORREÇÃO 3: saldo vem da blockchain, não do banco
app.get('/users/:id/balance', async (req, res) => {
  try {
    const userId = req.params.id;
    const pool = await getPool();

    const result = await pool.query
      (
        'SELECT wallet_address FROM user_profiles WHERE id = $1',
        [userId]
      );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { wallet_address } = result.rows[0];

    if (!wallet_address) {
      return res.status(400).json({ error: 'User has no wallet yet' });
    }

    const BLOCKCHAIN_URL = process.env.BLOCKCHAIN_URL || 'http://blockchain_service:3004';
    const blockchainRes = await fetch(`${BLOCKCHAIN_URL}/wallets/${wallet_address}/balance`);

    if (!blockchainRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch balance from blockchain' });
    }

    const { balance } = await blockchainRes.json();

    res.json({ wallet_address, balance });
  }
  catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /users/me - Atualizar nome e foto de perfil
app.put('/users/me', authenticateToken, async (req, res) => {
  try {
    const authUserId = req.user.id;
    const { name, profile_picture } = req.body;

    if (!name && !profile_picture) {
      return res.status(400).json({ error: 'At least one field (name or profile_picture) must be provided' });
    }

    const pool = await getPool();

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) { updates.push(` name = $${paramIndex++}`); values.push(name); }
    if (profile_picture) { updates.push(` profile_picture = $${paramIndex++}`); values.push(profile_picture); }

    updates.push(` updated_at = $${paramIndex++}`);
    values.push(new Date());

    const updateQuery = `UPDATE user_profiles SET ${updates.join(',')} WHERE auth_user_id = $${paramIndex} RETURNING *`;
    values.push(authUserId);

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({ message: 'Profile updated successfully', profile: result.rows[0] });
  }
  catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// DELETE /users/me - Deletar conta
app.delete('/users/me', authenticateToken, async (req, res) => {
  try {
    const authUserId = req.user.id;
    const pool = await getPool();

    await pool.query('DELETE FROM user_profiles WHERE auth_user_id = $1', [authUserId]);

    res.json({ message: 'User profile deleted successfully' });
  }
  catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  try {
    console.log('Starting User Service...');

    config = await vaultClient.getServiceConfig();

    console.log('Configuration loaded:');
    console.log(`   - Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
    console.log(`   - JWT Algorithm: ${config.jwt.algorithm}`);

    await initDatabase();

    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`User service ready on port ${PORT}`);
    });
  }
  catch (error) {
    console.error('Failed to start user service:', error);
    process.exit(1);
  }
}

bootstrap();