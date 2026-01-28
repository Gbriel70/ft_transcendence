const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { pool } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.SERVICE_PORT || 3001;
const SALT_ROUNDS = 10;

app.use(express.json());

// Registration endpoint
app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const userExists = await client.query('SELECT id FROM auth.credentials WHERE email = $1 OR username = $2', [email, name]);
    if (userExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email or Username already registered' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const authResult = await client.query(
      'INSERT INTO auth.credentials (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [email, name, password_hash]
    );
    const userId = authResult.rows[0].id;

    await client.query(
      'INSERT INTO users.profiles (user_id, display_name, balance) VALUES ($1, $2, 1000.00)',
      [userId, name]
    );

    await client.query('COMMIT');

    // Generate JWT token
    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: userId, email: email, name: name, balance: 1000.00 },
      token
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  } finally {
    if (client) client.release();
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT id, username, password_hash FROM auth.credentials WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

    res.json(
      {
        message: 'Login successful',
        user: { id: user.id, email: email, name: user.username },
        token
      });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});