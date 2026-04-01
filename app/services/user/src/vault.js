const fs = require('fs').promises;
const path = require('path');

const VAULT_ADDR = process.env.VAULT_ADDR || 'http://vault:8200';
const VAULT_DATA_DIR = '/vault-keys';
const APPROLE_DIR = path.join(VAULT_DATA_DIR, 'approles');

class VaultClient
{
    constructor()
    {
        this.token = null;
        // 'auth' no auth service, 'user' no user service
        this.serviceName = process.env.SERVICE_NAME || 'auth';
    }

    // AUTHENTICATE USING APPROLE
    async authenticate()
    {
        try
        {
            console.log(`Authenticating ${this.serviceName}-service with Vault...`);

            const roleIdPath   = path.join(APPROLE_DIR, `${this.serviceName}_role_id`);
            const secretIdPath = path.join(APPROLE_DIR, `${this.serviceName}_secret_id`);

            console.log(`   Reading from: ${roleIdPath}`);

            const roleId   = await fs.readFile(roleIdPath,   'utf8');
            const secretId = await fs.readFile(secretIdPath, 'utf8');

            const response = await fetch(`${VAULT_ADDR}/v1/auth/approle/login`,
            {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify
                ({
                    role_id:   roleId.trim(),
                    secret_id: secretId.trim()
                })
            });

            if (!response.ok)
            {
                throw new Error(`Vault auth failed: ${response.statusText}`);
            }

            const data = await response.json();
            this.token = data.auth.client_token;

            console.log(`Authenticated! Token TTL: ${data.auth.lease_duration}s`);

            this.scheduleTokenRenewal(data.auth.lease_duration);

            return this.token;
        }
        catch (error)
        {
            console.error('Vault authentication failed:', error.message);
            throw error;
        }
    }

    // SCHEDULE TOKEN RENEWAL
    scheduleTokenRenewal(ttl)
    {
        const renewAt = (ttl * 0.9) * 1000;

        setTimeout(async () =>
        {
            console.log('Renewing Vault token...');

            try
            {
                const response = await fetch(`${VAULT_ADDR}/v1/auth/token/renew-self`,
                {
                    method:  'POST',
                    headers: { 'X-Vault-Token': this.token }
                });

                if (response.ok)
                {
                    const data = await response.json();
                    console.log(`Token renewed! New TTL: ${data.auth.lease_duration}s`);
                    this.scheduleTokenRenewal(data.auth.lease_duration);
                }
                else
                {
                    console.warn('Token renewal failed, re-authenticating...');
                    await this.authenticate();
                }
            }
            catch (error)
            {
                console.error('Token renewal error:', error.message);
                await this.authenticate();
            }
        }, renewAt);
    }

    // READ SECRET FROM VAULT
    async getSecret(secretPath)
    {
        if (!this.token)
        {
            await this.authenticate();
        }

        try
        {
            const response = await fetch(`${VAULT_ADDR}/v1/secret/data/${secretPath}`,
            {
                headers: { 'X-Vault-Token': this.token }
            });

            if (!response.ok)
            {
                throw new Error(`Failed to read ${secretPath}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data.data;
        }
        catch (error)
        {
            console.error(`Error reading secret '${secretPath}':`, error.message);
            throw error;
        }
    }

    async getDatabaseCredentials()
    {
        console.log('Fetching database credentials from Vault...');
        return await this.getSecret('database');
    }

    // ─── CORREÇÃO: internalSecret exposto no config ───────────────────────────
    async getServiceConfig()
    {
        console.log(`Fetching ${this.serviceName} config from Vault...`);

        const [dbCreds, jwtData, serviceConfig] = await Promise.all
        ([
            this.getDatabaseCredentials(),
            this.getSecret('jwt'),
            this.getSecret(this.serviceName)
        ]);

        return {
            database:
            {
                host:     dbCreds.host,
                port:     parseInt(dbCreds.port),
                name:     dbCreds.name,
                user:     dbCreds.user,
                password: dbCreds.password
            },
            jwt:
            {
                secret:    jwtData.secret,
                expiresIn: jwtData.expires_in  || '24h',
                algorithm: jwtData.algorithm   || 'HS256'
            },
            port:           parseInt(serviceConfig.port),
            bcryptRounds:   parseInt(serviceConfig.bcrypt_rounds) || 12,
            internalSecret: serviceConfig.internal_secret   // ← CORREÇÃO
        };
    }
}

module.exports = new VaultClient();