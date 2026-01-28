const axios = require('axios');

class VaultClient 
{
    constructor() 
    {
        this.vaultAddr = process.env.VAULT_ADDR || 'http://vault:8200';
        this.vaultToken = process.env.VAULT_TOKEN;
        this.serviceName = process.env.SERVICE_NAME || 'auth';
        
        if (!this.vaultToken) 
            {
                console.warn('VAULT_TOKEN not set. Using fallback to .env');
            }
    }

    async getSecret(path) 
    {
        try 
        {
            const response = await axios.get( `${this.vaultAddr}/v1/secret/data/${path}`,
                {
                    headers: {
                        'X-Vault-Token': this.vaultToken
                    },
                    timeout: 5000
                }
            );
            
            return response.data.data.data;
        } catch (error) 
        {
            console.error(`Error fetching secret from Vault (${path}):`, error.message);
            return null;
        }
    }

    async getDatabaseConfig() 
    {
        const dbSecrets = await this.getSecret('database');
        
        if (!dbSecrets) 
        {
            console.warn('Using environment variables for database');
            return {
                host: process.env.DB_HOST || 'postgres',
                port: parseInt(process.env.DB_PORT) || 5432,
                database: process.env.DB_NAME || 'minibank',
                user: process.env.DB_USER || 'minibank_user',
                password: process.env.DB_PASSWORD || 'changeme'
            };
        }
        
        return {
            host: dbSecrets.host,
            port: parseInt(dbSecrets.port),
            database: dbSecrets.name,
            user: dbSecrets.user,
            password: dbSecrets.password
        };
    }

    async getServiceConfig() 
    {
        const serviceSecrets = await this.getSecret(this.serviceName);
        const jwtSecrets = await this.getSecret('jwt');
        
        return {
            port: serviceSecrets?.port || process.env.PORT || 3000,
            jwtSecret: jwtSecrets?.secret || process.env.JWT_SECRET,
            jwtExpiresIn: jwtSecrets?.expires_in || 86400,
            bcryptRounds: serviceSecrets?.bcrypt_rounds || 10
        };
    }
}

module.exports = new VaultClient();