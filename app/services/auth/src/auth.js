const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const client = require('prom-client');
const { getPool, initDatabase } = require('./db');
const vaultClient = require('./vault');

const app = express();
app.use(express.json());

let config;

// ─── Prometheus ───────────────────────────────────────────────────────────────

const register = client.register;
register.setDefaultLabels({ service: process.env.SERVICE_NAME || 'auth' });
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

const authLoginTotal = new client.Counter({
    name: 'auth_login_total',
    help: 'Total login attempts',
    labelNames: ['result', 'reason'],
    registers: [register],
});

const auth2faTotal = new client.Counter({
    name: 'auth_2fa_total',
    help: 'Total 2FA operations',
    labelNames: ['action', 'result'],
    registers: [register],
});

const authTokenRefreshTotal = new client.Counter({
    name: 'auth_token_refresh_total',
    help: 'Total token refresh attempts',
    labelNames: ['result'],
    registers: [register],
});

const dbQueryDuration = new client.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of PostgreSQL queries in seconds',
    labelNames: ['operation'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    registers: [register],
});

async function dbQuery(pool, sql, params = [])
{
    const op = sql.trim().split(/\s+/)[0].toUpperCase();
    const end = dbQueryDuration.startTimer({ operation: op });
    try { const r = await pool.query(sql, params); end(); return r; }
    catch (err) { end(); throw err; }
}

app.use((req, res, next) =>
{
    if (req.path === '/metrics') return next();

    const endTimer = httpRequestDuration.startTimer();

    res.on('finish', () =>
    {
        const route = req.route && req.route.path ? `${req.baseUrl || ''}${req.route.path}` : req.path;
        const labels = { method: req.method, route, status_code: res.statusCode };
        httpRequestsTotal.inc(labels);
        endTimer(labels);
    });

    next();
});

// ─── CORREÇÃO 1: Guard — rejeita requisições antes do bootstrap terminar ──────

app.use((req, res, next) =>
{
    if (!config && req.path !== '/health' && req.path !== '/metrics')
    {
        return res.status(503).json({ error: 'Service starting up, try again shortly' });
    }
    next();
});

// ─── Metrics & Health ─────────────────────────────────────────────────────────

app.get('/metrics', async (req, res) =>
{
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.get('/health', (req, res) =>
{
    res.json({ status: 'ok', service: 'auth' });
});

// ─── Middleware JWT ───────────────────────────────────────────────────────────

function requireAuth(req, res)
{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) { res.status(401).json({ error: 'Access token required' }); return null; }
    try { return jwt.verify(token, config.jwt.secret); }
    catch (e) { res.status(403).json({ error: 'Invalid token' }); return null; }
}

// ─── CORREÇÃO 2: createUserProfile envia internal secret ─────────────────────

async function createUserProfile(authUserId, username)
{
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user_service:3002';

    try
    {
        const response = await fetch(`${userServiceUrl}/users`,
        {
            method: 'POST',
            headers:
            {
                'Content-Type':      'application/json',
                'x-internal-secret': config.internalSecret
            },
            body: JSON.stringify({ auth_user_id: authUserId, name: username })
        });

        if (!response.ok)
        {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create user profile');
        }

        return await response.json();
    }
    catch (error)
    {
        console.error('Error creating user profile:', error.message);
        throw error;
    }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /register
app.post('/register', async (req, res) =>
{
    try
    {
        const { email, password, name } = req.body;

        if (!email || !password || !name)
        {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const pool = await getPool();

        const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

        const result = await pool.query
        (
            'INSERT INTO user_auth (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
            [email, hashedPassword, name]
        );

        const user = result.rows[0];

        try
        {
            await createUserProfile(user.id, name);
        }
        catch (error)
        {
            // ROLLBACK: remove auth user se o perfil não foi criado
            await pool.query('DELETE FROM user_auth WHERE id = $1', [user.id]);
            throw new Error('Failed to create user profile');
        }

        const token = jwt.sign
        (
            { id: user.id, email: user.email },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn, algorithm: config.jwt.algorithm }
        );

        res.status(201).json
        ({
            message: 'User registered successfully',
            token,
            user:
            {
                id:       user.id,
                email:    user.email,
                username: user.name
            }
        });
    }
    catch (error)
    {
        if (error.code === '23505')
        {
            return res.status(409).json({ error: 'Email already in use' });
        }
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /login
app.post('/login', async (req, res) =>
{
    try
    {
        const { email, password } = req.body;

        if (!email || !password)
        {
            return res.status(400).json({ error: 'Missing email or password' });
        }

        const pool = await getPool();
        const result = await dbQuery(pool, 'SELECT * FROM user_auth WHERE email = $1', [email]);

        if (result.rows.length === 0)
        {
            authLoginTotal.inc({ result: 'failure', reason: 'user_not_found' });
            return res.status(404).json({
                error: 'Account does not exist',
                code: 'ACCOUNT_NOT_FOUND'
            });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword)
        {
            authLoginTotal.inc({ result: 'failure', reason: 'invalid_password' });
            return res.status(401).json({
                error: 'Incorrect password',
                code: 'INVALID_PASSWORD'
            });
        }

        // Se 2FA está ativo, retorna temp token
        if (user.totp_enabled)
        {
            authLoginTotal.inc({ result: 'pending_2fa', reason: 'requires_2fa' });
            const tempToken = jwt.sign(
                { id: user.id, twoFactorPending: true },
                config.jwt.secret,
                { expiresIn: '5m', algorithm: config.jwt.algorithm }
            );
            return res.json({ requires2FA: true, tempToken });
        }

        const token = jwt.sign
        (
            { id: user.id, email: user.email },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn, algorithm: config.jwt.algorithm }
        );

        authLoginTotal.inc({ result: 'success', reason: 'password' });
        res.json
        ({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });
    }
    catch (error)
    {
        authLoginTotal.inc({ result: 'error', reason: 'server_error' });
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /change-email
app.put('/change-email', async (req, res) =>
{
    try
    {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token)
        {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        const { newEmail } = req.body;

        if (!newEmail)
        {
            return res.status(400).json({ error: 'New email is required' });
        }

        const pool = await getPool();

        const checkResult = await pool.query('SELECT id FROM user_auth WHERE email = $1', [newEmail]);
        if (checkResult.rows.length > 0)
        {
            return res.status(409).json({ error: 'Email already in use' });
        }

        await pool.query('UPDATE user_auth SET email = $1 WHERE id = $2', [newEmail, decoded.id]);

        res.json({ message: 'Email updated successfully' });
    }
    catch (error)
    {
        if (error.name === 'JsonWebTokenError')
        {
            return res.status(403).json({ error: 'Invalid token' });
        }
        console.error('Error updating email:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /change-password
app.put('/change-password', async (req, res) =>
{
    try
    {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token)
        {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword)
        {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6)
        {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const pool = await getPool();
        const result = await pool.query('SELECT password_hash FROM user_auth WHERE id = $1', [decoded.id]);

        if (result.rows.length === 0)
        {
            return res.status(404).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!validPassword)
        {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
        await pool.query('UPDATE user_auth SET password_hash = $1 WHERE id = $2', [hashedPassword, decoded.id]);

        res.json({ message: 'Password updated successfully' });
    }
    catch (error)
    {
        if (error.name === 'JsonWebTokenError')
        {
            return res.status(403).json({ error: 'Invalid token' });
        }
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── 2FA ──────────────────────────────────────────────────────────────────────

// POST /2fa/setup
app.post('/2fa/setup', async (req, res) =>
{
    try
    {
        const decoded = requireAuth(req, res);
        if (!decoded) return;

        const pool = await getPool();
        const result = await pool.query('SELECT email, totp_enabled FROM user_auth WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = result.rows[0];
        if (user.totp_enabled) return res.status(400).json({ error: '2FA is already enabled' });

        const secret = speakeasy.generateSecret({ name: `MiniBank (${user.email})`, length: 20 });

        await pool.query('UPDATE user_auth SET totp_secret = $1, totp_enabled = FALSE WHERE id = $2', [secret.base32, decoded.id]);

        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({ secret: secret.base32, qrCode: qrCodeDataUrl });
    }
    catch (error)
    {
        console.error('Error setting up 2FA:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /2fa/verify
app.post('/2fa/verify', async (req, res) =>
{
    try
    {
        const decoded = requireAuth(req, res);
        if (!decoded) return;

        const { token: totpToken } = req.body;
        if (!totpToken) return res.status(400).json({ error: 'TOTP token required' });

        const pool = await getPool();
        const result = await pool.query('SELECT totp_secret FROM user_auth WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const { totp_secret } = result.rows[0];
        if (!totp_secret) return res.status(400).json({ error: 'Run /2fa/setup first' });

        const valid = speakeasy.totp.verify({ secret: totp_secret, encoding: 'base32', token: totpToken, window: 1 });
        if (!valid) { auth2faTotal.inc({ action: 'verify', result: 'failure' }); return res.status(400).json({ error: 'Invalid TOTP code' }); }

        await pool.query('UPDATE user_auth SET totp_enabled = TRUE WHERE id = $1', [decoded.id]);
        auth2faTotal.inc({ action: 'verify', result: 'success' });
        res.json({ message: '2FA enabled successfully' });
    }
    catch (error)
    {
        console.error('Error verifying 2FA:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /2fa/disable
app.post('/2fa/disable', async (req, res) =>
{
    try
    {
        const decoded = requireAuth(req, res);
        if (!decoded) return;

        const { token: totpToken } = req.body;
        if (!totpToken) return res.status(400).json({ error: 'TOTP token required to disable 2FA' });

        const pool = await getPool();
        const result = await pool.query('SELECT totp_secret, totp_enabled FROM user_auth WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const { totp_secret, totp_enabled } = result.rows[0];
        if (!totp_enabled) return res.status(400).json({ error: '2FA is not enabled' });

        const valid = speakeasy.totp.verify({ secret: totp_secret, encoding: 'base32', token: totpToken, window: 1 });
        if (!valid) { auth2faTotal.inc({ action: 'disable', result: 'failure' }); return res.status(400).json({ error: 'Invalid TOTP code' }); }

        await pool.query('UPDATE user_auth SET totp_secret = NULL, totp_enabled = FALSE WHERE id = $1', [decoded.id]);
        auth2faTotal.inc({ action: 'disable', result: 'success' });
        res.json({ message: '2FA disabled successfully' });
    }
    catch (error)
    {
        console.error('Error disabling 2FA:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /2fa/authenticate
app.post('/2fa/authenticate', async (req, res) =>
{
    try
    {
        const { tempToken, token: totpToken } = req.body;
        if (!tempToken || !totpToken) return res.status(400).json({ error: 'tempToken and TOTP token required' });

        let decoded;
        try { decoded = jwt.verify(tempToken, config.jwt.secret); }
        catch (e) { return res.status(403).json({ error: 'Invalid or expired temp token' }); }

        if (!decoded.twoFactorPending) return res.status(403).json({ error: 'Invalid temp token' });

        const pool = await getPool();
        const result = await pool.query('SELECT id, email, name, totp_secret FROM user_auth WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = result.rows[0];
        const valid = speakeasy.totp.verify({ secret: user.totp_secret, encoding: 'base32', token: totpToken, window: 1 });
        if (!valid) { auth2faTotal.inc({ action: 'authenticate', result: 'failure' }); return res.status(400).json({ error: 'Invalid TOTP code' }); }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn, algorithm: config.jwt.algorithm }
        );

        authLoginTotal.inc({ result: 'success', reason: '2fa' });
        auth2faTotal.inc({ action: 'authenticate', result: 'success' });
        res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, name: user.name } });
    }
    catch (error)
    {
        console.error('Error in 2FA authenticate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /2fa/status
app.get('/2fa/status', async (req, res) =>
{
    try
    {
        const decoded = requireAuth(req, res);
        if (!decoded) return;

        const pool = await getPool();
        const result = await pool.query('SELECT totp_enabled FROM user_auth WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        res.json({ enabled: result.rows[0].totp_enabled });
    }
    catch (error)
    {
        console.error('Error checking 2FA status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── Email Helper ─────────────────────────────────────────────────────────────

function createMailTransporter() {
    const host = process.env.SMTP_HOST;
    if (!host) return null;
    return nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || '',
        } : undefined,
    });
}

async function sendEmail(to, subject, html) {
    const from = process.env.SMTP_FROM || 'noreply@minibank.local';
    const transporter = createMailTransporter();
    if (!transporter) {
        console.log(`[EMAIL] To: ${to} | Subject: ${subject}\n${html.replace(/<[^>]+>/g, '')}`);
        return;
    }
    await transporter.sendMail({ from, to, subject, html });
}

// ─── GDPR ─────────────────────────────────────────────────────────────────────

// GET /gdpr/export — download all personal data as JSON
app.get('/gdpr/export', async (req, res) =>
{
    try
    {
        const decoded = requireAuth(req, res);
        if (!decoded) return;

        const pool = await getPool();

        // Fetch auth record (exclude password_hash & totp_secret)
        const authResult = await pool.query(
            'SELECT id, email, name, created_at FROM user_auth WHERE id = $1',
            [decoded.id]
        );
        if (authResult.rows.length === 0)
            return res.status(404).json({ error: 'User not found' });

        const authData = authResult.rows[0];

        // Fetch profile + blockchain data from user service GDPR aggregation endpoint
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user_service:3002';
        let profileData = null;
        let blockchainData = null;
        let partialExport = false;
        try
        {
            const gdprRes = await fetch(`${userServiceUrl}/users/me/gdpr-export`, {
                headers: {
                    'Authorization': req.headers['authorization'],
                    'x-internal-secret': config.internalSecret,
                }
            });
            if (gdprRes.ok)
            {
                const gdprData = await gdprRes.json();
                profileData = gdprData.profile || null;
                blockchainData = gdprData.blockchain || null;
                
                // Mark as partial if blockchain had issues
                if (blockchainData && blockchainData.partial_export)
                {
                    partialExport = true;
                }
            }
        }
        catch (e)
        {
            console.warn('Could not fetch GDPR export data:', e.message);
            partialExport = true;
        }

        const exportData = {
            exported_at: new Date().toISOString(),
            account: {
                id: authData.id,
                email: authData.email,
                name: authData.name,
                registered_at: authData.created_at,
            },
            profile: profileData || null,
            blockchain: blockchainData || null,
            export_metadata: {
                partial_export: partialExport,
                notes: partialExport ? 'Some data may be incomplete due to service unavailability' : null
            }
        };

        const exportedAtTime = new Date().toUTCString();
        const blockchainNote = blockchainData 
            ? `<p>Your blockchain wallet data (balance and transaction history) has been included.</p>`
            : `<p>Your blockchain wallet data could not be retrieved; please retry or contact support.</p>`;

        await sendEmail(
            authData.email,
            'MiniBank — Your data export',
            `<p>Hello ${authData.name},</p>
             <p>Your personal data export was downloaded on ${exportedAtTime}.</p>
             <p>The exported file contains:</p>
             <ul>
               <li>Account information (email, name, registration date)</li>
               <li>Profile information (wallet address, profile data)</li>
               ${blockchainData && !blockchainData.partial_export ? '<li>Blockchain data (balance snapshot, transaction history)</li>' : ''}
             </ul>
             ${blockchainNote}
             <p>On-chain transactions are immutable and cannot be deleted. Your account and profile data will be permanently deleted if you request account deletion.</p>
             <p>If you did not request this, please contact support immediately.</p>`
        );

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="my-minibank-data.json"');
        res.send(JSON.stringify(exportData, null, 2));
    }
    catch (error)
    {
        console.error('GDPR export error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /gdpr/delete-request — request account deletion; sends confirmation email
app.post('/gdpr/delete-request', async (req, res) =>
{
    try
    {
        const decoded = requireAuth(req, res);
        if (!decoded) return;

        const pool = await getPool();

        const authResult = await pool.query(
            'SELECT id, email, name FROM user_auth WHERE id = $1',
            [decoded.id]
        );
        if (authResult.rows.length === 0)
            return res.status(404).json({ error: 'User not found' });

        const user = authResult.rows[0];

        // Remove any existing pending request for this user
        await pool.query('DELETE FROM gdpr_delete_requests WHERE auth_user_id = $1', [user.id]);

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

        await pool.query(
            'INSERT INTO gdpr_delete_requests (auth_user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, token, expiresAt]
        );

        const APP_URL = process.env.APP_URL || 'https://localhost';
        const confirmUrl = `${APP_URL}/#/gdpr-confirm?token=${token}`;

        await sendEmail(
            user.email,
            'MiniBank — Confirm account deletion',
            `<p>Hello ${user.name},</p>
             <p>We received a request to permanently delete your MiniBank account and all associated data.</p>
             <p><strong>This action is irreversible.</strong></p>
             <p>Upon deletion, the following will be permanently removed:</p>
             <ul>
               <li>Your account credentials and profile information</li>
               <li>Your wallet address association</li>
               <li>All personal data stored in our database</li>
             </ul>
             <p><strong>Important:</strong> Transactions recorded on the blockchain are immutable and will remain permanently on-chain. Your account deletion does not remove or modify on-chain transaction history.</p>
             <p>To confirm, click the link below (valid for 24 hours):</p>
             <p><a href="${confirmUrl}">${confirmUrl}</a></p>
             <p>If you did not request this, you can safely ignore this email — your account will remain active.</p>`
        );

        res.json({ message: 'Confirmation email sent. Please check your inbox to confirm deletion.' });
    }
    catch (error)
    {
        console.error('GDPR delete-request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /gdpr/confirm-delete — confirm deletion via token
app.delete('/gdpr/confirm-delete', async (req, res) =>
{
    try
    {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token required' });

        const pool = await getPool();

        const reqResult = await pool.query(
            `SELECT r.auth_user_id, r.expires_at, u.email, u.name
             FROM gdpr_delete_requests r
             JOIN user_auth u ON u.id = r.auth_user_id
             WHERE r.token = $1`,
            [token]
        );

        if (reqResult.rows.length === 0)
            return res.status(404).json({ error: 'Invalid or already used token' });

        const { auth_user_id, expires_at, email, name } = reqResult.rows[0];

        if (new Date() > new Date(expires_at))
        {
            await pool.query('DELETE FROM gdpr_delete_requests WHERE token = $1', [token]);
            return res.status(410).json({ error: 'Token has expired. Please submit a new deletion request.' });
        }

        // Delete the user — CASCADE handles user_profiles and gdpr_delete_requests
        await pool.query('DELETE FROM user_auth WHERE id = $1', [auth_user_id]);

        await sendEmail(
            email,
            'MiniBank — Your account has been deleted',
            `<p>Hello ${name},</p>
             <p>Your MiniBank account and all associated personal data have been permanently deleted as requested.</p>
             <p>Deleted data includes:</p>
             <ul>
               <li>Your account credentials and profile information</li>
               <li>Your wallet address and association</li>
               <li>All personal records stored in our database</li>
             </ul>
             <p><strong>Note on blockchain data:</strong> Transactions recorded on the blockchain are immutable by design. Your transaction history and any associated on-chain records will remain permanently on the blockchain and cannot be deleted. This is a fundamental property of blockchain technology and applies to all blockchain-based systems.</p>
             <p>We are sorry to see you go. If you ever change your mind, you are always welcome to create a new account.</p>`
        );

        res.json({ message: 'Account permanently deleted.' });
    }
    catch (error)
    {
        console.error('GDPR confirm-delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap()
{
    try
    {
        console.log('Starting Auth Service...');

        config = await vaultClient.getServiceConfig();

        console.log('Configuration loaded:');
        console.log(`   - Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
        console.log(`   - JWT Algorithm: ${config.jwt.algorithm}`);
        console.log(`   - JWT Expires: ${config.jwt.expiresIn}`);
        console.log(`   - Bcrypt Rounds: ${config.bcryptRounds}`);

        await initDatabase();

        const PORT = config.port;
        app.listen(PORT, () =>
        {
            console.log(`Auth service ready on port ${PORT}`);
        });
    }
    catch (error)
    {
        console.error('Failed to start auth service:', error);
        process.exit(1);
    }
}

bootstrap();