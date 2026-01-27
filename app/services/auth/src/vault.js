// filepath: app/services/user/src/vault.js
// filepath: app/services/transition/src/vault.js
// filepath: app/services/blockchain/src/vault.js

const axios = require('axios');

const VAULT_ADDR = process.env.VAULT_ADDR || 'http://localhost:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN || 'dev-only-token';

async function getSecrets(path) {
  try {
    const response = await axios.get(`${VAULT_ADDR}/v1/${path}`, {
      headers: {
        'X-Vault-Token': VAULT_TOKEN
      }
    });
    
    return response.data.data.data; // KV v2 format
  } catch (error) {
    console.error(`❌ Error fetching secrets from ${path}:`, error.message);
    throw error;
  }
}

module.exports = { getSecrets };