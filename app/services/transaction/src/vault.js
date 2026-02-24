const fs = require('fs');
const vault = require('node-vault');

const readFile = (filePath) => fs.readFileSync(filePath, 'utf8').trim();

let client;

async function getClient() {
  if (client) return client;

  const serviceName = process.env.SERVICE_NAME || 'transaction';
  const roleId = readFile(process.env.VAULT_ROLE_ID_FILE || `/vault-keys/approles/${serviceName}_role_id`);
  const secretId = readFile(process.env.VAULT_SECRET_ID_FILE || `/vault-keys/approles/${serviceName}_secret_id`);

  client = vault({ endpoint: process.env.VAULT_ADDR });
  const res = await client.approleLogin({ role_id: roleId, secret_id: secretId });
  client.token = res.auth.client_token;

  return client;
}

async function getSecret(secretPath, key) {
  const c = await getClient();
  const res = await c.read(`secret/data/${secretPath}`);
  return res.data.data[key];
}

async function initVault() {
  process.env.DB_USER = process.env.DB_USER || (await getSecret('database', 'user'));
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || (await getSecret('database', 'password'));
}

module.exports = { initVault, getSecret };
