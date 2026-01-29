const express = require('express');
const { initVault } = require('./vault');

const app = express();
const PORT = process.env.SERVICE_PORT || 3003;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'transition',
    timestamp: new Date().toISOString()
  });
});

// Get transactions
app.get('/transactions', (req, res) => {
  res.json({ message: 'Get transactions endpoint' });
});

// Create transaction
app.post('/transactions', (req, res) => {
  res.json({ message: 'Create transaction endpoint' });
});

async function bootstrap()
{
  await initVault();

  app.listen(PORT, () => {
    console.log(`✅ Transition service running on port ${PORT}`);
  });
}

bootstrap();