const express = require('express');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { savePrivateKey, getPrivateKey, getServiceConfig } = require('./vault');

const app = express();
app.use(express.json());

let config;
let provider;
let contract;
let ownerWallet;

// Load contract ABI
function loadContractABI() 
{
  const artifactPath = path.join(__dirname, '../artifacts/contracts/MiniBank.sol/MiniBank.json');
  if (fs.existsSync(artifactPath)) 
  {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return artifact.abi;
  }
  throw new Error(`Contract artifact not found at ${artifactPath}`);
}

// Initialize blockchain connection
async function initializeBlockchain()
{
  console.log('Initializing blockchain connection...');

  provider = new ethers.JsonRpcProvider(config.hardhatUrl);
  
  const network = await provider.getNetwork();
  console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);

  const abi = loadContractABI();
  contract = new ethers.Contract(config.contractAddress, abi, provider);

  // Get owner wallet (first hardhat account)
  const accounts = await provider.listAccounts();
  ownerWallet = await provider.getSigner(accounts[0].address);

  console.log(`Contract: ${config.contractAddress}`);
  console.log(`Owner: ${await ownerWallet.getAddress()}`);
}

// POST /wallets -> Create a new wallet for a user
app.post('/wallets', async (req, res) => 
{
  try 
  {
    const { user_id } = req.body;
    if (!user_id) 
    {
      return res.status(400).json({ error: 'Missing user_id in request body' });
    }

    console.log(`Creating wallet for user ${user_id}...`);
    
    // Check if wallet already exists
    const existingWallet = await contract.getWallet(user_id);
    if (existingWallet !== ethers.ZeroAddress)
    {
      return res.status(409).json({ error: 'Wallet already exists for this user' });
    }

    // Create new wallet
    const wallet = ethers.Wallet.createRandom();
    const walletAddress = wallet.address;
    const privateKey = wallet.privateKey;

    // Save private key in Vault
    await savePrivateKey(user_id, privateKey);

    // Register wallet in smart contract
    const contractWithSigner = contract.connect(ownerWallet);
    const tx = await contractWithSigner.registerWallet(user_id, walletAddress);
    await tx.wait();

    console.log(`Wallet created: ${walletAddress}`);
    res.status(201).json
    ({ 
      message: 'Wallet created successfully',
      wallet_address: walletAddress,
      tx_hash: tx.hash
    });
  } catch (error)
  {
    console.error('Error creating wallet:', error);
    res.status(500).json({ error: error.message || 'Failed to create wallet' });
  }
});

// GET /wallets/:user_id -> Get wallet address for a user
app.get('/wallets/:user_id', async (req, res) => 
{
  try
  {
    const user_id = parseInt(req.params.user_id);
    const walletAddress = await contract.getWallet(user_id);
    
    if (walletAddress === ethers.ZeroAddress)
    {
      return res.status(404).json({ error: 'Wallet not found for this user' });
    }
    
    res.json({ wallet_address: walletAddress });
  } catch (error) 
  {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /balances/:address -> Get wallet balance
app.get('/balances/:address', async (req, res) => 
{
  try
  {
    const address = req.params.address;
    const balance = await contract.getBalance(address);
    
    res.json
    ({
      address: address,
      balance: ethers.formatEther(balance),
      balance_wei: balance.toString() 
    });
  } catch (error)
  {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /deposit -> Deposit funds
app.post('/deposit', async (req, res) => 
{
  try
  {
    const { user_id, amount } = req.body;
    if (!user_id || !amount) 
    {
      return res.status(400).json({ error: 'Missing user_id or amount' });
    }

    const walletAddress = await contract.getWallet(user_id);
    if (walletAddress === ethers.ZeroAddress) 
    {
      return res.status(404).json({ error: 'Wallet not found for this user' });
    }

    const privateKey = await getPrivateKey(user_id);
    const userWallet = new ethers.Wallet(privateKey, provider);

    const contractWithSigner = contract.connect(userWallet);
    const tx = await contractWithSigner.deposit
    ({ 
      value: ethers.parseEther(amount.toString()) 
    });
    await tx.wait();

    console.log(`Deposit successful for user ${user_id}`);
    res.json
    ({ 
      message: 'Deposit successful',
      tx_hash: tx.hash
    });
  } catch (error) 
  {
    console.error('Error depositing:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /transfer -> Transfer funds
app.post('/transfer', async (req, res) => 
{
  try
  {
    const { from_user_id, to_user_id, amount } = req.body;
    if (!from_user_id || !to_user_id || !amount) 
    {
      return res.status(400).json({ error: 'Missing from_user_id, to_user_id or amount' });
    }

    const fromAddress = await contract.getWallet(from_user_id);
    const toAddress = await contract.getWallet(to_user_id);
    
    if (fromAddress === ethers.ZeroAddress) 
    {
      return res.status(404).json({ error: 'Sender wallet not found' });
    }
    if (toAddress === ethers.ZeroAddress) 
    {
      return res.status(404).json({ error: 'Recipient wallet not found' });
    }

    const privateKey = await getPrivateKey(from_user_id);
    const senderWallet = new ethers.Wallet(privateKey, provider);

    const contractWithSigner = contract.connect(senderWallet);
    const tx = await contractWithSigner.transfer
    (
      toAddress, 
      ethers.parseEther(amount.toString())
    );
    await tx.wait();

    console.log(`Transfer successful: ${from_user_id} -> ${to_user_id}`);
    res.json
    ({
      message: 'Transfer successful',
      tx_hash: tx.hash,
      from: fromAddress,
      to: toAddress,
      amount: amount
    });
  } catch (error)
  {
    console.error('Error transferring funds:', error);
    res.status(500).json({ error: error.message });
  }
});

async function bootstrap()
{
  try
  {
    console.log('Starting Blockchain Service...');

    // Wait for Hardhat node
    console.log('Waiting for Hardhat node...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Load config
    config = await getServiceConfig();
    console.log(`Hardhat: ${config.hardhatUrl}`);
    console.log(`Contract: ${config.contractAddress}`);

    // Initialize blockchain
    await initializeBlockchain();
    
    // Start server
    const PORT = config.port;
    app.listen(PORT, () => 
    {
      console.log(`Blockchain service ready on port ${PORT}`);
    });
  } catch (error)
  {
    console.error('Error starting blockchain service:', error);
    process.exit(1);
  }
}

bootstrap();
