const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

async function saveToVault(contractAddress)
{
  const VAULT_ADDR      = process.env.VAULT_ADDR      || "http://vault:8200";
  const VAULT_KV_PATH   = process.env.VAULT_KV_PATH   || "secret/data/blockchain";
  const VAULT_ROLE_ID   = fs.readFileSync(process.env.VAULT_ROLE_ID_FILE,   "utf8").trim();
  const VAULT_SECRET_ID = fs.readFileSync(process.env.VAULT_SECRET_ID_FILE, "utf8").trim();

  console.log("Authenticating with Vault...");

  // AppRole login
  const loginRes = await fetch(`${VAULT_ADDR}/v1/auth/approle/login`,
  {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ role_id: VAULT_ROLE_ID, secret_id: VAULT_SECRET_ID })
  });

  if (!loginRes.ok)
    throw new Error(`Vault login failed: ${loginRes.statusText}`);

  const loginData = await loginRes.json();
  const token = loginData.auth.client_token;

  console.log("Saving contract_address to Vault...");

  // Read existing secrets first to not overwrite them
  const readRes = await fetch(`${VAULT_ADDR}/v1/${VAULT_KV_PATH}`,
  {
    headers: { "X-Vault-Token": token }
  });

  let existingData = {};
  if (readRes.ok)
  {
    const readJson = await readRes.json();
    existingData = readJson.data?.data || {};
  }

  // Write back with contract_address added
  const writeRes = await fetch(`${VAULT_ADDR}/v1/${VAULT_KV_PATH}`,
  {
    method:  "POST",
    headers: { "Content-Type": "application/json", "X-Vault-Token": token },
    body:    JSON.stringify
    ({
      data: {
        ...existingData,
        contract_address: contractAddress
      }
    })
  });

  if (!writeRes.ok)
    throw new Error(`Failed to save to Vault: ${writeRes.statusText}`);

  console.log(`contract_address saved to Vault: ${contractAddress}`);
}

async function main()
{
  console.log("\n==============================");
  console.log("  Deploying MiniBank Contract");
  console.log("==============================\n");

  // Deployer info
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);

  console.log(`Deployer : ${deployerAddress}`);
  console.log(`Balance  : ${hre.ethers.formatEther(balance)} ETH\n`);

  // Deploy
  console.log("Deploying MiniBank...");
  const MiniBank = await hre.ethers.getContractFactory("MiniBank");
  const miniBank = await MiniBank.deploy();
  await miniBank.waitForDeployment();

  const contractAddress = await miniBank.getAddress();

  console.log(`\nMiniBank deployed to: ${contractAddress}`);

  // Verify owner
  const owner = await miniBank.owner();
  console.log(`Owner verified      : ${owner === deployerAddress ? "OK" : "MISMATCH"}\n`);

  // Save deployment.json (shared via volume with blockchain_service)
  const deploymentInfo = {
    contractAddress,
    deployerAddress,
    chainId:   Number((await hre.ethers.provider.getNetwork()).chainId),
    timestamp: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`deployment.json saved to: ${deploymentPath}`);

  // Save contract_address to Vault
  await saveToVault(contractAddress);

  console.log("\n============================");
  console.log("  Deploy completed!");
  console.log("============================\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) =>
  {
    console.error("\nDeploy failed:", err.message);
    process.exit(1);
  });