const express = require('express');

const app = express();
const PORT = process.env.SERVICE_PORT || 3004;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'blockchain',
    timestamp: new Date().toISOString()
  });
});

// Get blocks
app.get('/blocks', (req, res) => {
  res.json({ message: 'Get blocks endpoint' });
});

// Create block
app.post('/blocks', (req, res) => {
  res.json({ message: 'Create block endpoint' });
});

app.listen(PORT, () => {
  console.log(`✅ Blockchain service running on port ${PORT}`);
});