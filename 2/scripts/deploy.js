const { readFileSync } = require('fs');
const { join } = require('path');
const { ethers } = require('ethers');

const {
  FLARE_COSTON2_RPC_URL,
  DEPLOYER_PRIVATE_KEY,
  TOKEN0_NAME = 'Token A',
  TOKEN0_SYMBOL = 'TKA',
  TOKEN1_NAME = 'Token B',
  TOKEN1_SYMBOL = 'TKB',
} = process.env;

if (!FLARE_COSTON2_RPC_URL) {
  console.error('Missing FLARE_COSTON2_RPC_URL environment variable.');
  process.exit(1);
}

if (!DEPLOYER_PRIVATE_KEY) {
  console.error('Missing DEPLOYER_PRIVATE_KEY environment variable.');
  process.exit(1);
}

const loadArtifact = (contractName) => {
  const artifactPath = join(__dirname, '..', 'out', `${contractName}.sol`, `${contractName}.json`);
  return JSON.parse(readFileSync(artifactPath, 'utf-8'));
};

async function main() {
  const provider = new ethers.JsonRpcProvider(FLARE_COSTON2_RPC_URL);
  const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

  console.log('Using deployer:', wallet.address);

  const factoryArtifact = loadArtifact('MiniAMMFactory');
  const tokenArtifact = loadArtifact('MockERC20');

  const factoryFactory = new ethers.ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode.object,
    wallet,
  );
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;
  if (!gasPrice) {
    throw new Error('Unable to fetch gas price from provider');
  }
  console.log('Using gas price:', gasPrice.toString());

  const txOverrides = { gasPrice, type: 0 };

  const factoryTx = await factoryFactory.deploy(txOverrides);
  console.log('MiniAMMFactory deployment hash:', factoryTx.deploymentTransaction().hash);
  await factoryTx.waitForDeployment();
  const factoryAddress = await factoryTx.getAddress();
  console.log('MiniAMMFactory deployed at:', factoryAddress);

  const tokenFactory = new ethers.ContractFactory(
    tokenArtifact.abi,
    tokenArtifact.bytecode.object,
    wallet,
  );

  const token0Tx = await tokenFactory.deploy(TOKEN0_NAME, TOKEN0_SYMBOL, txOverrides);
  console.log(`${TOKEN0_NAME} deployment hash:`, token0Tx.deploymentTransaction().hash);
  await token0Tx.waitForDeployment();
  const token0Address = await token0Tx.getAddress();
  console.log(`${TOKEN0_NAME} deployed at:`, token0Address);

  const token1Tx = await tokenFactory.deploy(TOKEN1_NAME, TOKEN1_SYMBOL, txOverrides);
  console.log(`${TOKEN1_NAME} deployment hash:`, token1Tx.deploymentTransaction().hash);
  await token1Tx.waitForDeployment();
  const token1Address = await token1Tx.getAddress();
  console.log(`${TOKEN1_NAME} deployed at:`, token1Address);

  const createPairResponse = await factoryTx.createPair(token0Address, token1Address, txOverrides);
  console.log('createPair tx hash:', createPairResponse.hash);
  const createPairReceipt = await createPairResponse.wait();
  console.log('createPair confirmed in block:', createPairReceipt.blockNumber);

  const pairAddress = await factoryTx.getPair(token0Address, token1Address);
  console.log('MiniAMM pair deployed at:', pairAddress);

  console.log('\nSummary');
  console.log('Factory:', factoryAddress);
  console.log('Token0:', token0Address, `(${TOKEN0_SYMBOL})`);
  console.log('Token1:', token1Address, `(${TOKEN1_SYMBOL})`);
  console.log('Pair:', pairAddress);
}

main().catch((error) => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
