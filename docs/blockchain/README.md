# Blockchain Module Documentation

## Overview

The Blockchain module implements a Solidity smart contract (`MiniBank`) deployed on a local Hardhat Ethereum node. It manages user wallets and transactions with immutability guarantees.

## Smart Contract: MiniBank

### Location

```
app/services/blockchain/hardhat/contracts/MiniBank.sol
```

### Core Functionality

**Wallet Management**
- Each user has one wallet (EOA or contract-generated)
- Wallet address stored in `user_profiles.wallet_address`

**Transactions**
- `transfer(amount)` - Send funds from caller to recipient
- `getBalance(address)` - Query wallet balance
- `transactionCount(address)` - Get number of transactions

**Immutability**
- All transactions logged in contract state
- No transaction reversal (except via fallback recovery)
- Events emitted for off-chain indexing

### Contract Deployment

```javascript
// app/services/blockchain/hardhat/scripts/deploy.js
const contract = await ethers.deployContract('MiniBank');
await contract.waitForDeployment();
const address = await contract.getAddress();

// Store in Vault: secret/blockchain > contract_address
```

**Deployment Steps**:
1. Hardhat node starts (local RPC at `http://localhost:8545`)
2. Deploy script executes via `hardhat run scripts/deploy.js --network localhost`
3. Contract address saved to Vault
4. blockchain_service loads address on startup

## Hardhat Node

### Configuration

```javascript
// hardhat.config.js
module.exports = {
  solidity: '0.8.x',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337 // Local network ID
    }
  }
};
```

### Features

- **Instant mining** - Every transaction mines immediately (no wait)
- **Pre-funded accounts** - 10,000 ETH each (dev purpose)
- **Mnemonic seed** - Deterministic for reproducible tests
- **Snapshot/restore** - State management (not currently used)

### Launch

```bash
docker-compose up hardhat
```

Hardhat listens on `http://hardhat:8545` (within Docker network).

## blockchain_service Integration

### Service Architecture

```
blockchain_service (Node.js + Express.js)
    ↓
ethers.js (Ethereum library)
    ↓
Hardhat JSON-RPC (http://hardhat:8545)
    ↓
MiniBank.sol contract
```

### Initialization Flow

```javascript
async function initializeBlockchain() {
  // 1. Connect to Hardhat RPC
  provider = new ethers.JsonRpcProvider(config.hardhatUrl);
  
  // 2. Load contract ABI from artifact
  const abi = loadContractABI();
  
  // 3. Fetch contract address from Vault
  const contractAddress = await getSecret('blockchain', 'contract_address');
  
  // 4. Create contract instance
  contract = new ethers.Contract(contractAddress, abi, ownerWallet);
}
```

### Wallet Management

**Owner Wallet** (for initial contract deployment)
- Private key from Vault: `secret/blockchain > private_key`
- Used for contract method calls requiring signer

**User Wallets** (created on demand)
- Generated via ethers.Wallet.createRandom()
- Private key stored in Vault: `secret/<user_id>/wallet_private_key`
- Address stored in database: `user_profiles.wallet_address`

### Key Routes

#### POST /wallets - Create Wallet

```http
Body: { user_id: 1 }
Response:
{
  "wallet_address": "0x7e...",
  "tx_hash": "0x3a...",
  "balance": "0"
}
```

Action:
1. Generate new random wallet
2. Store private key in Vault
3. Transfer initial balance from owner (if testing)
4. Return address + tx hash

#### GET /wallets/:address/balance

```http
Response: { balance: "1000000000000000000" }  // Wei (1 ETH = 10^18 Wei)
```

Calls `contract.getBalance(address)` (read-only).

#### POST /tx - Execute Transaction

```http
Body:
{
  "from": "0x7e...",
  "to": "0x...",
  "amount": "100"  // Amount in Wei
}
Response:
{
  "tx_hash": "0x3a...",
  "from": "0x7e...",
  "to": "0x...",
  "amount": "100",
  "status": "mined"
}
```

Action:
1. Load sender's wallet (private key from Vault)
2. Call `contract.transfer(to, amount)` as signer
3. Wait for transaction to mine
4. Return receipt

## Integration with transaction_service

### Transfer Flow

```
1. Frontend sends POST /api/tx/transactions
   Body: { to_user_id, amount }
   
2. transaction_service:
   - Authenticates user via JWT
   - Fetches sender wallet from user_service
   - Fetches recipient wallet from user_service
   - Calls blockchain_service POST /tx
   - Logs transaction in PostgreSQL
   - Returns confirmation
   
3. blockchain_service:
   - Executes transaction on MiniBank contract
   - Returns tx_hash (on-chain proof)
   
4. transaction_service stores:
   - tx_database_id (local record)
   - tx_blockchain_hash (immutable proof)
```

## Metrics & Monitoring

**Prometheus Counters**:
- `blockchain_wallets_created_total` - Successful wallet creations
- `blockchain_tx_total{type=transfer|balance_check|...}` - Transaction count by type
- `blockchain_tx_errors_total{type}` - Failed transactions
- `blockchain_tx_duration_seconds{type}` - Execution time histogram

## Gas & Cost Considerations

### Development (Hardhat)

- No real gas cost (unlimited funds)
- Instant mining (no pending pool)
- Gas limit/price configurable but not enforced

### Production Migration

For Avalanche testnet:
- Requires testnet AVAX tokens (faucet available)
- Real gas costs (e.g., transfer ≈ 0.001 AVAX)
- Asynchronous transaction confirmation (30s+)
- Would need gas estimation and user confirmation

## Limitations & Future Work

- **No multi-sig**: Single EOA per user (no recovery if key lost)
- **No flash loans**: Can't detect atomic swaps or arbitrage
- **No upgradeable contract**: MiniBank is immutable once deployed
- **No event indexing**: Events not indexed (The Graph could enhance this)

## Additional Files

- [SMART_CONTRACT_API.md](./SMART_CONTRACT_API.md) - ABI reference
- [HARDHAT_SETUP.md](./HARDHAT_SETUP.md) - Local node configuration
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Move to testnet/mainnet
