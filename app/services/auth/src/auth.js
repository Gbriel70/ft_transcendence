const express = require('express');

const app = express();
const PORT = process.env.SERVICE_PORT || 3001;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'auth',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint' });
});

// Register endpoint
app.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint' });
});

app.listen(PORT, () => {
  console.log(`✅ Auth service running on port ${PORT}`);
});