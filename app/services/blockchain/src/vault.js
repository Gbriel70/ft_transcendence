const fs    = require('fs');
const vault = require('node-vault');

const readFile = (filePath) => fs.readFileSync(filePath, 'utf8').trim();

let client;
let tokenExpiry = 0; // timestamp em ms quando o token expira

// ─── AUTENTICAÇÃO ─────────────────────────────────────────────────────────────

async function getClient()
{
    const now = Date.now();

    // Re-autentica se o token expirou ou vai expirar nos próximos 5 minutos
    if (client && now < tokenExpiry - 5 * 60 * 1000)
    {
        return client;
    }

    const serviceName = process.env.SERVICE_NAME || 'blockchain';
    const roleId      = readFile(process.env.VAULT_ROLE_ID_FILE   || `/vault-keys/approles/${serviceName}_role_id`);
    const secretId    = readFile(process.env.VAULT_SECRET_ID_FILE || `/vault-keys/approles/${serviceName}_secret_id`);

    const newClient = vault({ endpoint: process.env.VAULT_ADDR || 'http://vault:8200' });

    const res       = await newClient.approleLogin({ role_id: roleId, secret_id: secretId });
    newClient.token = res.auth.client_token;

    const ttl  = res.auth.lease_duration; // em segundos
    tokenExpiry = Date.now() + ttl * 1000;
    client      = newClient;

    console.log(`Authenticated with Vault as '${serviceName}' (TTL: ${ttl}s, expira em ${new Date(tokenExpiry).toISOString()})`);

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
    let internalSecret;
    try
    {
        internalSecret = await getSecret('internal_secret');
    }
    catch (error)
    {
        // Keep service booting even if this key is not present in blockchain KV path.
        internalSecret = process.env.INTERNAL_SECRET || 'internal-secret-key';
    }

    return { hardhatUrl, contractAddress, port, internalSecret };
}

module.exports = { getSecret, savePrivateKeyToVault, getPrivateKeyFromVault, getServiceConfig };