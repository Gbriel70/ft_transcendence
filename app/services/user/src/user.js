const express = require('express');
const { initVault } = require('./vault');

const app = express();
const PORT = process.env.SERVICE_PORT || 3002;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'user',
    timestamp: new Date().toISOString()
  });
});

// Get profile
app.get('/profile/:id', (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

// Update profile
app.post('/profile', (req, res) => {
  res.json({ message: 'Update profile endpoint' });
});

async function bootstrap()
{
  await initVault();

  app.listen(PORT, () => {
    console.log(`✅ User service running on port ${PORT}`);
  });
}

bootstrap();