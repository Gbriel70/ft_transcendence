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
  const kvPath = process.env.VAULT_KV_PATH;
  const res = await c.read(kvPath);
  return res.data.data[key];
}

async function savePrivateKey(userId, privateKey)
{
  const c = await getClient();
  const kvPath = `secret/data/wallets/${userId}`;

  await c.write(kvPath, 
  {
    data: 
    {
      private_key: privateKey,
      created_at: new Date().toISOString()
    }
  });

  console.log(`Private key saved for user ${userId}`);
}

async function getPrivateKey(userId)
{
  const c = await getClient();
  const kvPath = `secret/data/wallets/${userId}`;
  const res = await c.read(kvPath);
  return res.data.data.private_key;
}

async function getServiceConfig()
{
  const hardhatUrl = process.env.HARDHAT_URL || 'http://hardhat:8545';
  const contractAddress = await getSecret('contract_address');
  const port = parseInt(process.env.SERVICE_PORT) || 3004;

  return { hardhatUrl, contractAddress, port };
}

module.exports = { getSecret, savePrivateKey, getPrivateKey, getServiceConfig };