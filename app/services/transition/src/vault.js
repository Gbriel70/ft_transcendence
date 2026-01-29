const fs = require('fs');
const vault = require('node-vault');

const readFile = (filePath) => fs.readFileSync(filePath, 'utf8').trim();

let client;

async function getClient()
{
  if (client) return client;

  const roleId = readFile(process.env.VAULT_ROLE_ID_FILE);
  const secretId = readFile(process.env.VAULT_SECRET_ID_FILE);

  client = vault({ endpoint: process.env.VAULT_ADDR });
  const res = await client.approleLogin({ role_id: roleId, secret_id: secretId });
  client.token = res.auth.client_token;

  return client;
}

async function getSecret(key)
{
  const c = await getClient();
  const path = process.env.VAULT_KV_PATH;
  const res = await c.read(path);
  return res.data.data[key];
}

async function initVault()
{
  process.env.DB_USER = process.env.DB_USER || (await getSecret('db_user'));
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || (await getSecret('db_password'));
}

module.exports = { initVault, getSecret };
