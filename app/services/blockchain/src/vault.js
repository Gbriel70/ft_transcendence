const fs    = require('fs');
const vault = require('node-vault');

const readFile = (filePath) => fs.readFileSync(filePath, 'utf8').trim();

let client;

// ─── AUTENTICAÇÃO ─────────────────────────────────────────────────────────────

async function getClient()
{
    if (client) return client;

    const serviceName = process.env.SERVICE_NAME || 'blockchain';
    const roleId      = readFile(process.env.VAULT_ROLE_ID_FILE   || `/vault-keys/approles/${serviceName}_role_id`);
    const secretId    = readFile(process.env.VAULT_SECRET_ID_FILE || `/vault-keys/approles/${serviceName}_secret_id`);

    client = vault({ endpoint: process.env.VAULT_ADDR || 'http://vault:8200' });

    const res    = await client.approleLogin({ role_id: roleId, secret_id: secretId });
    client.token = res.auth.client_token;

    console.log(`Authenticated with Vault as '${serviceName}'`);

    return client;
}

// ─── CORREÇÃO: getSecret lê sempre do VAULT_KV_PATH e filtra pela key ─────────

async function getSecret(key)
{
    const c       = await getClient();
    const kvPath  = process.env.VAULT_KV_PATH || 'secret/data/blockchain';
    const res     = await c.read(kvPath);

    const value = res.data.data[key];

    if (value === undefined)
    {
        throw new Error(`Key '${key}' not found in Vault at '${kvPath}'`);
    }

    return value;
}

// ─── PRIVATE KEYS ─────────────────────────────────────────────────────────────

const savePrivateKeyToVault = async (userId, privateKey) =>
{
    const c = await getClient();
    await c.write(`secret/data/wallets/user_${userId}`, {
        data: { privateKey }
    });
    console.log(`Private key saved to Vault for user ${userId}`);
};

const getPrivateKeyFromVault = async (userId) =>
{
    const c = await getClient();
    const result = await c.read(`secret/data/wallets/user_${userId}`);
    return result.data.data.privateKey;
};

// ─── SERVICE CONFIG ───────────────────────────────────────────────────────────

async function getServiceConfig()
{
    const hardhatUrl      = process.env.HARDHAT_URL    || 'http://hardhat:8545';
    const port            = parseInt(process.env.SERVICE_PORT) || 3004;

    // CORREÇÃO: chamada correta com apenas a key
    const contractAddress = await getSecret('contract_address');

    return { hardhatUrl, contractAddress, port };
}

module.exports = { getSecret, savePrivateKeyToVault, getPrivateKeyFromVault, getServiceConfig };