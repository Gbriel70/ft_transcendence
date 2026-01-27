const axios = require('axios');

const VAULT_ADDR = process.env.VAULT_ADDR || 'http://localhost:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN || 'dev-only-token';

async function getSecrets(path = 'secret/auth') {
  try {
    console.log(`🔐 Fetching secrets from ${VAULT_ADDR}/v1/${path}...`);
    
    const response = await axios.get(`${VAULT_ADDR}/v1/${path}`, {
      headers: {
        'X-Vault-Token': VAULT_TOKEN
      }
    });
    
    console.log('✅ Secrets retrieved successfully');
    return response.data.data.data; // KV v2 format
  } catch (error) {
    console.error(`❌ Error fetching secrets from ${path}:`, error.message);
    throw error;
  }
}

module.exports = { getSecrets };