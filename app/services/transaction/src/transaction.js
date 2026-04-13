const express = require('express');
const client  = require('prom-client');
const jwt     = require('jsonwebtoken');
const http    = require('http');
const { initVault, getSecret } = require('./vault');

const app  = express();
const PORT = process.env.SERVICE_PORT || 3003;
const BLOCKCHAIN_URL = process.env.BLOCKCHAIN_URL || 'http://blockchain_service:3004';

app.use(express.json());

// ── Metrics ───────────────────────────────────────────────────────────────────
const register = client.register;
register.setDefaultLabels({ service: process.env.SERVICE_NAME || 'transaction' });
client.collectDefaultMetrics({ register });

const transactionAmountEth = new client.Histogram({
    name: 'transaction_amount_eth',
    help: 'Distribution of transaction amounts (in token units)',
    labelNames: ['type'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
    registers: [register],
});

const transactionErrorsTotal = new client.Counter({
    name: 'transaction_errors_total',
    help: 'Total failed transaction operations',
    labelNames: ['type'],
    registers: [register],
});

const transactionTotal = new client.Counter({
    name: 'transaction_total',
    help: 'Total successful transaction operations',
    labelNames: ['type'],
    registers: [register],
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
});

// ── Helpers ───────────────────────────────────────────────────────────────────
let jwtSecret;

const authenticate = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        req.user = jwt.verify(auth.split(' ')[1], jwtSecret);
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Call blockchain service internal API
const callBlockchain = async (method, path, body = null) => {
    const url = new URL(path, BLOCKCHAIN_URL);

    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };

    const response = await fetch(url.toString(), {
        ...options,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `Blockchain error: ${response.status}`);
    }

    return data;
};

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'transaction' }));

// GET /transactions - List transactions for the authenticated user by blockchain service
app.get('/transactions', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        // Search wallet address for user
        const walletData = await callBlockchain('GET', `/wallets/${userId}`).catch(() => null);

        if (!walletData || !walletData.wallet_address) {
            return res.json({ transactions: [] });
        }

        // Search transactions for wallet address
        const txHistory = await callBlockchain(
            'GET',
            `/wallets/${walletData.wallet_address}/transactions`
        );

        const transactions = Array.isArray(txHistory?.transactions)
            ? txHistory.transactions
            : [];

        transactionTotal.inc({ type: 'get' });
        return res.json({ transactions });

    } catch (err) {
        transactionErrorsTotal.inc({ type: 'get' });
        console.error('Get transactions error:', err);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

// POST /transactions - transfer by blockchain
app.post('/transactions', authenticate, async (req, res) => {
    const { to_user_id, amount } = req.body;

    if (!to_user_id || !amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Missing to_user_id or amount' });
    }

    try {
        const from_user_id = req.user.userId || req.user.id;

        if (from_user_id === parseInt(to_user_id)) {
            return res.status(400).json({ error: 'Cannot transfer to yourself' });
        }

        // Call blockchain service to transfer
        const parsedAmount = Math.floor(parseFloat(amount));
        const result = await callBlockchain('POST', '/transfer', {
            from_user_id,
            to_user_id: parseInt(to_user_id),
            amount: parsedAmount
        });

        transactionTotal.inc({ type: 'transfer' });
        transactionAmountEth.observe({ type: 'transfer' }, parsedAmount);
        res.status(201).json({ success: true, ...result });
    } catch (err) {
        transactionErrorsTotal.inc({ type: 'transfer' });
        console.error('Transfer error:', err);
        res.status(500).json({ error: err.message || 'Transfer failed' });
    }
});

// POST /deposit
app.post('/deposit', authenticate, async (req, res) => {
    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    try {
        const user_id = req.user.userId || req.user.id;

        const parsedAmount = parseFloat(amount);
        const result = await callBlockchain('POST', '/deposit', {
            user_id,
            amount: parsedAmount
        });

        transactionTotal.inc({ type: 'deposit' });
        transactionAmountEth.observe({ type: 'deposit' }, parsedAmount);
        res.json({ success: true, ...result });
    } catch (err) {
        transactionErrorsTotal.inc({ type: 'deposit' });
        console.error('Deposit error:', err);
        res.status(500).json({ error: err.message || 'Deposit failed' });
    }
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap() {
    await initVault();

    jwtSecret = await getSecret('jwt', 'secret')
        .catch(() => process.env.JWT_SECRET || 'fallback_secret');

    app.listen(PORT, () => {
        console.log(`✅ Transaction service running on port ${PORT}`);
    });
}

bootstrap();