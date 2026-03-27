const express    = require('express');
const { ethers } = require('ethers');
const fs         = require('fs');
const path       = require('path');
const {  getSecret, savePrivateKeyToVault, getPrivateKeyFromVault, getServiceConfig  } = require('./vault');
const client = require('prom-client');


const app = express();
app.use(express.json());

let config;
let provider;
let contract;
let ownerWallet;

// ==================== METRICS ====================
const register = client.register;
register.setDefaultLabels({ service: 'blockchain' });
client.collectDefaultMetrics({ register });

const walletsCreatedTotal = new client.Counter({
  name: 'blockchain_wallets_created_total',
  help: 'Total number of wallets successfully created',
  registers: [register],
});

const txTotal = new client.Counter({
  name: 'blockchain_tx_total',
  help: 'Total number of blockchain transactions by type',
  labelNames: ['type'],
  registers: [register],
});

const txErrorsTotal = new client.Counter({
  name: 'blockchain_tx_errors_total',
  help: 'Total number of failed blockchain transactions by type',
  labelNames: ['type'],
  registers: [register],
});

const txDuration = new client.Histogram({
  name: 'blockchain_tx_duration_seconds',
  help: 'Duration of blockchain transactions in seconds',
  labelNames: ['type'],
  buckets: [0.5, 1, 2, 5, 10, 30],
  registers: [register],
});
// =====================================================


// ─── CONTRACT ABI ─────────────────────────────────────────────────────────────

function loadContractABI()
{
    const artifactPath = path.join(__dirname, '../artifacts/contracts/MiniBank.sol/MiniBank.json');

    if (!fs.existsSync(artifactPath))
    {
        throw new Error(`Contract artifact not found at ${artifactPath}`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return artifact.abi;
}

// ─── CORREÇÃO: polling real em vez de setTimeout fixo ────────────────────────

async function waitForHardhat(url, maxAttempts = 30, delayMs = 3000)
{
    for (let attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            const testProvider = new ethers.JsonRpcProvider(url);
            await testProvider.getNetwork();
            console.log('Hardhat node is ready!');
            return;
        }
        catch (err)
        {
            console.log(`Waiting for Hardhat (attempt ${attempt}/${maxAttempts}): ${err.message}`);
            if (attempt === maxAttempts) throw new Error('Hardhat not reachable after max attempts');
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
}

// ─── BLOCKCHAIN INIT ──────────────────────────────────────────────────────────

async function initializeBlockchain()
{
    console.log('Initializing blockchain connection...');

    provider = new ethers.JsonRpcProvider(config.hardhatUrl);

    const network = await provider.getNetwork();
    console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);

    const abi = loadContractABI();
    contract  = new ethers.Contract(config.contractAddress, abi, provider);

    const accounts  = await provider.listAccounts();
    ownerWallet     = await provider.getSigner(accounts[0].address);

    console.log(`Contract : ${config.contractAddress}`);
    console.log(`Owner    : ${await ownerWallet.getAddress()}`);
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// GET /metrics -> Prometheus scrape endpoint
app.get('/metrics', async (req, res) =>
{
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// POST /wallets — Cria wallet para um usuário
app.post('/wallets', async (req, res) =>
{
    try
    {
        const { user_id } = req.body;

        if (!user_id)
            return res.status(400).json({ error: 'Missing user_id' });

        // 1. Gerar keypair para o usuário
        const userWallet = ethers.Wallet.createRandom().connect(provider);

        // 2. Owner envia ETH para a wallet pagar gas futuro
        const fundTx = await ownerWallet.sendTransaction({
            to:    userWallet.address,
            value: ethers.parseEther("1.0")  // 1 ETH para gas
        });
        await fundTx.wait();

        // 3. Registrar no contrato (credita 100 tokens)
        const contractWithOwner = contract.connect(ownerWallet);
        const tx = await contractWithOwner.registerWallet(user_id, userWallet.address);
        await tx.wait();

        // 4. Salvar chave privada no Vault (SEGURO!)
        await savePrivateKeyToVault(user_id, userWallet.privateKey);

        walletsCreatedTotal.inc();
        txTotal.inc({ type: 'wallet_creation' });

        res.json({
            user_id,
            wallet_address: userWallet.address,
            balance:        100
        });
    }
    catch (error)
    {
        console.error('Error creating wallet:', error);
        txErrorsTotal.inc({ type: 'wallet_creation' });
        res.status(500).json({ error: error.message });
    }
});

// GET /wallets/:user_id — Busca wallet pelo ID do usuário
app.get('/wallets/:user_id', async (req, res) =>
{
    try
    {
        const user_id       = parseInt(req.params.user_id);
        const walletAddress = await contract.getWallet(user_id);

        if (walletAddress === ethers.ZeroAddress)
        {
            return res.status(404).json({ error: 'Wallet not found for this user' });
        }

        txTotal.inc({ type: 'get_wallet' });
        res.json({ wallet_address: walletAddress });
    }
    catch (error)
    {
        console.error('Error fetching wallet:', error);
        txErrorsTotal.inc({ type: 'get_wallet' });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CORREÇÃO: rota corrigida para bater com o que o User Service chama
// GET /wallets/:address/balance — Consulta saldo pelo endereço da wallet
app.get('/wallets/:address/balance', async (req, res) =>
{
    try
    {
        const { address } = req.params;

        if (!ethers.isAddress(address))
        {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const balance = await contract.getBalance(address);

        txTotal.inc({ type: 'get_balance' });
        res.json
        ({
            address,
            balance: balance.toString()
        });
    }
    catch (error)
    {
        console.error('Error fetching balance:', error);
        txErrorsTotal.inc({ type: 'get_balance' });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /wallets/:address/transactions — histórico on-chain para uma wallet
app.get('/wallets/:address/transactions', async (req, res) =>
{
    try
    {
        const { address } = req.params;

        if (!ethers.isAddress(address))
        {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const incomingFilter = contract.filters.Transfer(null, address);
        const outgoingFilter = contract.filters.Transfer(address, null);

        const [incomingEvents, outgoingEvents] = await Promise.all([
            contract.queryFilter(incomingFilter),
            contract.queryFilter(outgoingFilter)
        ]);

        const normalizeEvent = (event, direction) =>
        {
            const args = event.args || [];
            const from = (args.from ?? args[0] ?? '').toString();
            const to = (args.to ?? args[1] ?? '').toString();
            const amountRaw = args.amount ?? args[2] ?? 0n;
            const timestampRaw = args.timestamp ?? args[3] ?? 0n;
            const timestamp = Number(timestampRaw) || 0;

            return {
                tx_hash: event.transactionHash || null,
                from,
                to,
                amount: amountRaw.toString(),
                direction,
                counterparty: direction === 'in' ? from : to,
                status: 'completed',
                timestamp,
                created_at: timestamp > 0
                    ? new Date(timestamp * 1000).toISOString()
                    : new Date().toISOString(),
                block_number: event.blockNumber || null
            };
        };

        const transactions = [
            ...incomingEvents.map((event) => normalizeEvent(event, 'in')),
            ...outgoingEvents.map((event) => normalizeEvent(event, 'out'))
        ].sort((a, b) => {
            if ((b.timestamp || 0) !== (a.timestamp || 0)) {
                return (b.timestamp || 0) - (a.timestamp || 0);
            }
            return (b.block_number || 0) - (a.block_number || 0);
        });

        txTotal.inc({ type: 'get_transactions' });
        res.json({ wallet_address: address, transactions });
    }
    catch (error)
    {
        console.error('Error fetching transaction history:', error);
        txErrorsTotal.inc({ type: 'get_transactions' });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /transfer - transferir usando a chave do usuário
app.post('/transfer', async (req, res) =>
{
    const end = txDuration.startTimer({ type: 'transfer' });
    try
    {
        const { from_user_id, to_user_id, amount } = req.body;

        // 1. Buscar wallet addresses do contrato
        const fromAddress = await contract.getWallet(from_user_id);
        const toAddress   = await contract.getWallet(to_user_id);

        if (fromAddress === ethers.ZeroAddress)
            return res.status(404).json({ error: 'Sender wallet not found' });
        if (toAddress === ethers.ZeroAddress)
            return res.status(404).json({ error: 'Recipient wallet not found' });

        // 2. Verificar saldo
        const balance = await contract.getBalance(fromAddress);
        if (balance < BigInt(amount))
            return res.status(400).json({ error: `Insufficient balance. Has: ${balance}, needs: ${amount}` });

        // 3. Buscar chave privada do sender no Vault
        const privateKey = await getPrivateKeyFromVault(from_user_id);

        // 4. Criar signer com a chave do usuário (ele assina como msg.sender!)
        const userSigner          = new ethers.Wallet(privateKey, provider);
        const contractWithUser    = contract.connect(userSigner);

        // 5. Usuário assina e chama transfer() diretamente
        const tx = await contractWithUser.transfer(toAddress, BigInt(amount));
        await tx.wait();

        txTotal.inc({ type: 'transfer' });
        end();

        res.json({
            message: 'Transfer successful',
            tx_hash: tx.hash,
            from:    fromAddress,
            to:      toAddress,
            amount:  amount.toString()
        });
    }
    catch (error)
    {
        console.error('Transfer error:', error);
        txErrorsTotal.inc({ type: 'transfer' });
        end();
        res.status(500).json({ error: error.message });
    }
});

// ─── BOOTSTRAP ────────────────────────────────────────────────────────────────

async function bootstrap()
{
    try
    {
        console.log('Starting Blockchain Service...');

        // CORREÇÃO: polling real em vez de setTimeout fixo
        const hardhatUrl = process.env.HARDHAT_URL || 'http://hardhat:8545';
        await waitForHardhat(hardhatUrl);

        // Aguarda contract_address aparecer no Vault (deploy pode ainda estar rodando)
        let retries = 30;
        while (retries-- > 0)
        {
            try
            {
                config = await getServiceConfig();
                if (config.contractAddress) break;
            }
            catch (err)
            {
                console.log(`contract_address not in Vault yet, retrying... (${retries} left)`);
                await new Promise(r => setTimeout(r, 5000));
            }
        }

        if (!config || !config.contractAddress)
        {
            throw new Error('contract_address never appeared in Vault after retries');
        }

        console.log(`Hardhat  : ${config.hardhatUrl}`);
        console.log(`Contract : ${config.contractAddress}`);

        await initializeBlockchain();

        const PORT = config.port;
        app.listen(PORT, () =>
        {
            console.log(`Blockchain service ready on port ${PORT}`);
        });
    }
    catch (error)
    {
        console.error('Error starting blockchain service:', error);
        process.exit(1);
    }
}

bootstrap();
