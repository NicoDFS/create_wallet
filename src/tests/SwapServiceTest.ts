import { SwapService } from '../services/SwapService';
import { WalletService } from '../services/WalletService';
import { CHAIN_IDS } from '../types/db';

// Use mock implementations for testing
const TEST_USE_MOCK = true;

/**
 * Test ChangeNow API integration and SwapService
 */
async function testSwapService() {
  console.log('🧪 Testing SwapService...');
  
  // Create service instances (with mock implementations)
  const walletService = new WalletService();
  const swapService = new SwapService(TEST_USE_MOCK);
  
  try {
    // Initialize services
    await walletService.init();
    await swapService.init();
    
    console.log('✅ Services initialized');
    
    // Generate a test wallet
    const userId = `test-${Date.now()}`;
    const password = 'Test123!';
    const wallets = await walletService.generateAndStoreWallets(userId, password);
    
    if (!wallets.ethereum) {
      throw new Error('Failed to generate Ethereum wallet');
    }
    
    console.log('✅ Test wallet generated:', wallets.ethereum.address);
    
    // Get wallet ID
    const storedWallets = await walletService.getWallets(userId);
    const ethWallet = storedWallets.find(w => w.walletType === 'ethereum');
    
    if (!ethWallet) {
      throw new Error('Failed to retrieve Ethereum wallet from database');
    }
    
    // Test exchange rate estimation
    const fromCurrency = 'ETH';
    const toCurrency = 'BTC';
    const amount = '1.0';
    
    console.log(`Testing exchange rate: ${amount} ${fromCurrency} → ${toCurrency}...`);
    const rate = await swapService.getExchangeRate(
      fromCurrency, 
      toCurrency, 
      amount, 
      CHAIN_IDS.ETHEREUM_MAINNET,
      undefined
    );
    
    console.log('✅ Exchange rate:', rate);
    console.log(`  Estimated amount: ${rate.estimatedAmount} ${toCurrency}`);
    console.log(`  Rate: ${rate.rate}`);
    console.log(`  Fee: ${rate.fee}`);
    
    // Test transaction creation
    console.log('Creating swap transaction...');
    const swap = await swapService.createSwap(
      ethWallet.id,
      fromCurrency,
      toCurrency,
      amount,
      'mock-btc-address-for-testing', // Destination BTC address
      ethWallet.address, // Refund address
      CHAIN_IDS.ETHEREUM_MAINNET,
      undefined
    );
    
    console.log('✅ Swap transaction created:', swap);
    
    // Test transaction status check
    console.log('Checking swap status...');
    const status = await swapService.getSwapStatus(swap.hash);
    console.log('✅ Swap status:', status);
    
    // Test getting swaps by wallet
    console.log('Getting swaps by wallet...');
    const walletSwaps = await swapService.getSwapsByWallet(ethWallet.id);
    console.log(`✅ Found ${walletSwaps.length} swaps for wallet`);
    
    // Test getting swaps by user
    console.log('Getting swaps by user...');
    const userSwaps = await swapService.getSwapsByUser(userId);
    console.log(`✅ Found ${userSwaps.length} swaps for user`);
    
    // Test update pending swaps
    console.log('Updating pending swaps...');
    const updatedCount = await swapService.updatePendingSwaps();
    console.log(`✅ Updated ${updatedCount} pending swaps`);
    
    console.log('All tests completed successfully! 🎉');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up
    await swapService.cleanup();
    await walletService.cleanup();
  }
}

// Run the tests
testSwapService().then(() => {
  console.log('Tests completed');
}).catch(error => {
  console.error('Error running tests:', error);
}); 