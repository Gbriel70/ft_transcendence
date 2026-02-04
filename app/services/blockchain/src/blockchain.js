const express = require('express');
const { initVault } = require('./vault');

const app = express();
const PORT = process.env.SERVICE_PORT || 3004;

app.use(express.json());

async function bootstrap()
{
  await initVault();

  app.listen(PORT, () => {
    console.log(`✅ Blockchain service running on port ${PORT}`);
  });
}

bootstrap();