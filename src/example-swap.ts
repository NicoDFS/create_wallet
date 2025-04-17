import { WalletService } from './services/WalletService';
import { SwapService } from './services/SwapService';
import { CHAIN_IDS } from './types/db';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Example of using the SwapService for token swaps
 */
async function demoTokenSwap() {
  console.log('🚀 Token Swap Example');
  console.log('=====================');
  
  // Check if we're using mock or real implementation
  const useMock = process.env.API_MOCK === 'true';
  console.log(`Using ${useMock ? 'mock' : 'real'} API implementation`);
  
  // Create service instances
  const walletService = new WalletService();
  const swapService = new SwapService(useMock);
  
  try {
    // Initialize services
    await walletService.init();
    await swapService.init();
    
    // Create or get a user
    const userId = 'demo-user';
    let wallets = await walletService.getWallets(userId);
    
    // If no wallets exist, create them
    if (wallets.length === 0) {
      console.log('Creating new wallets for demo user...');
      const password = 'DemoPassword123!';
      const createdWallets = await walletService.generateAndStoreWallets(userId, password);
      
      // Also create an Ethereum wallet for Polygon network
      await walletService.generateEthereumWallet(userId, password, CHAIN_IDS.POLYGON_MAINNET);
      
      // Fetch the created wallets
      wallets = await walletService.getWallets(userId);
    }
    
    console.log(`Found ${wallets.length} wallets for user ${userId}`);
    
    // Find Ethereum and Polygon wallets
    const ethWallet = wallets.find(w => w.walletType === 'ethereum' && w.chainId === CHAIN_IDS.ETHEREUM_MAINNET);
    const polygonWallet = wallets.find(w => w.walletType === 'ethereum' && w.chainId === CHAIN_IDS.POLYGON_MAINNET);
    
    if (!ethWallet || !polygonWallet) {
      throw new Error('Required wallets not found');
    }
    
    console.log(`Ethereum wallet: ${ethWallet.address}`);
    console.log(`Polygon wallet: ${polygonWallet.address}`);
    
    // Example 1: Get exchange rate for ETH to MATIC swap
    console.log('\n1️⃣ Example 1: ETH to MATIC Exchange Rate');
    const ethAmount = '0.5';
    const ethToMaticRate = await swapService.getExchangeRate(
      'ETH', 
      'MATIC', 
      ethAmount,
      CHAIN_IDS.ETHEREUM_MAINNET, 
      CHAIN_IDS.POLYGON_MAINNET
    );
    
    console.log(`Exchange rate for ${ethAmount} ETH to MATIC:`);
    console.log(`  Estimated amount: ${ethToMaticRate.estimatedAmount} MATIC`);
    console.log(`  Rate: ${ethToMaticRate.rate}`);
    console.log(`  Fee: ${ethToMaticRate.fee}`);
    console.log(`  Network fee: ${ethToMaticRate.networkFee}`);
    
    // Example 2: Create a cross-chain swap transaction (ETH → MATIC)
    console.log('\n2️⃣ Example 2: Creating Cross-Chain Swap (ETH → MATIC)');
    const swap = await swapService.createSwap(
      ethWallet.id,
      'ETH',
      'MATIC',
      ethAmount,
      polygonWallet.address, // Send MATIC to Polygon wallet
      ethWallet.address, // Refund to Ethereum wallet if failed
      CHAIN_IDS.ETHEREUM_MAINNET,
      CHAIN_IDS.POLYGON_MAINNET
    );
    
    console.log('Swap transaction created:');
    console.log(`  ID: ${swap.id}`);
    console.log(`  From: ${swap.fromAddress} (${swap.currency})`);
    console.log(`  To: ${swap.toAddress}`);
    console.log(`  Amount: ${swap.amount}`);
    console.log(`  Status: ${swap.status}`);
    console.log(`  Transaction Hash: ${swap.hash}`);
    
    // Example 3: Check swap status
    console.log('\n3️⃣ Example 3: Checking Swap Status');
    const status = await swapService.getSwapStatus(swap.hash);
    console.log('Current swap status:');
    console.log(`  Status: ${status.status}`);
    if (status.payinHash) console.log(`  Payin Hash: ${status.payinHash}`);
    if (status.payoutHash) console.log(`  Payout Hash: ${status.payoutHash}`);
    
    // Example 4: Get all swaps for user
    console.log('\n4️⃣ Example 4: Listing All User Swaps');
    const userSwaps = await swapService.getSwapsByUser(userId);
    console.log(`Found ${userSwaps.length} swaps for user ${userId}:`);
    
    for (const userSwap of userSwaps) {
      console.log(`  - Swap ${userSwap.id}: ${userSwap.amount} ${userSwap.currency} (${userSwap.status})`);
    }
    
    // Example 5: Update pending swaps
    console.log('\n5️⃣ Example 5: Updating Pending Swaps');
    const updatedCount = await swapService.updatePendingSwaps();
    console.log(`Updated ${updatedCount} pending swaps`);
    
    // Show updated swap statuses
    const updatedSwaps = await swapService.getSwapsByUser(userId);
    console.log('Current swap statuses:');
    for (const updatedSwap of updatedSwaps) {
      console.log(`  - Swap ${updatedSwap.id}: ${updatedSwap.status}`);
    }
    
    console.log('\n✅ Demo completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error);
  } finally {
    // Clean up
    await swapService.cleanup();
    await walletService.cleanup();
  }
}

// Run the demo
demoTokenSwap().then(() => {
  console.log('Demo completed');
}).catch(error => {
  console.error('Error running demo:', error);
}); 