import { WalletService } from '../services/WalletService';
import { TransactionService } from '../services/TransactionService';
import { CHAIN_IDS } from '../types/db';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Test for TransactionService functionality
 * This test demonstrates transaction recording and retrieval
 */
async function testTransactionService() {
  console.log('=== TRANSACTION SERVICE TEST ===');
  
  // Create service instances
  const walletService = new WalletService();
  const transactionService = new TransactionService();
  
  try {
    // Initialize and connect to the database
    await walletService.init();
    await transactionService.init();
    console.log('Connected to database');
    
    // Generate wallets for a test user
    const userId = 'transaction-test-user-' + Date.now();
    const password = 'TestPassword123!';
    
    console.log(`Generating wallets for user: ${userId}`);
    const wallets = await walletService.generateAndStoreWallets(userId, password);
    
    // Get wallet records from database
    const storedWallets = await walletService.getWallets(userId);
    console.log(`Found ${storedWallets.length} wallets for user ${userId}`);
    
    // Get the wallet ID for the Ethereum wallet
    const ethWallet = storedWallets.find(w => w.walletType === 'ethereum');
    
    if (!ethWallet) {
      throw new Error('Ethereum wallet not found');
    }
    
    console.log('\n--- Recording Ethereum Transaction ---');
    
    // Record a receive transaction
    const receiveTransaction = await transactionService.recordTransaction(
      ethWallet.id,
      'receive',
      '0x1234567890123456789012345678901234567890', // From address
      ethWallet.address, // To address (our wallet)
      '1.5', // Amount
      'ETH', // Currency
      '0.002', // Fee
      'completed', // Status
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', // Hash
      ethWallet.chainId, // Chain ID
    );
    
    console.log('Recorded receive transaction:', {
      id: receiveTransaction.id,
      type: receiveTransaction.transactionType,
      amount: receiveTransaction.amount,
      currency: receiveTransaction.currency
    });
    
    // Record a send transaction
    const sendTransaction = await transactionService.recordTransaction(
      ethWallet.id,
      'send',
      ethWallet.address, // From address (our wallet)
      '0x0987654321098765432109876543210987654321', // To address
      '0.5', // Amount
      'ETH', // Currency
      '0.003', // Fee
      'pending', // Status
      '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // Hash
      ethWallet.chainId, // Chain ID
    );
    
    console.log('Recorded send transaction:', {
      id: sendTransaction.id,
      type: sendTransaction.transactionType,
      amount: sendTransaction.amount,
      currency: sendTransaction.currency,
      status: sendTransaction.status
    });
    
    // Update transaction status
    console.log('\n--- Updating Transaction Status ---');
    const updated = await transactionService.updateTransactionStatus(
      sendTransaction.id,
      'completed'
    );
    
    console.log(`Transaction status update ${updated ? 'succeeded' : 'failed'}`);
    
    // Record a cross-chain swap transaction
    console.log('\n--- Recording Cross-Chain Swap Transaction ---');
    
    // Generate Ethereum wallet for Polygon
    const polygonWallet = await walletService.generateEthereumWallet(
      userId,
      password,
      CHAIN_IDS.POLYGON_MAINNET
    );
    
    const swapTransaction = await transactionService.recordTransaction(
      ethWallet.id,
      'swap',
      ethWallet.address, // From address
      polygonWallet.address, // To address
      '5', // Amount
      'USDT', // Currency
      '0.01', // Fee
      'completed', // Status
      '0xswap1234567890swap1234567890swap1234567890swap1234567890', // Hash
      ethWallet.chainId, // Chain ID (Ethereum)
      CHAIN_IDS.ETHEREUM_MAINNET, // From Chain ID
      CHAIN_IDS.POLYGON_MAINNET // To Chain ID
    );
    
    console.log('Recorded swap transaction:', {
      id: swapTransaction.id,
      type: swapTransaction.transactionType,
      fromChain: swapTransaction.fromChainId,
      toChain: swapTransaction.toChainId,
      amount: swapTransaction.amount,
      currency: swapTransaction.currency
    });
    
    // Get transactions by wallet
    console.log('\n--- Getting Transactions by Wallet ---');
    const walletTransactions = await transactionService.getTransactionsByWallet(ethWallet.id);
    
    console.log(`Found ${walletTransactions.length} transactions for wallet ${ethWallet.address}`);
    walletTransactions.forEach(tx => {
      console.log(`- ${tx.transactionType} ${tx.amount} ${tx.currency} (${tx.status})`);
    });
    
    // Get transactions by user
    console.log('\n--- Getting Transactions by User ---');
    const userTransactions = await transactionService.getTransactionsByUser(userId);
    
    console.log(`Found ${userTransactions.length} transactions for user ${userId}`);
    
    // Get transaction by hash
    console.log('\n--- Getting Transaction by Hash ---');
    const txByHash = await transactionService.getTransactionByHash(swapTransaction.hash);
    
    if (txByHash) {
      console.log(`Found transaction: ${txByHash.transactionType} ${txByHash.amount} ${txByHash.currency}`);
      console.log(`From chain: ${txByHash.fromChainId}, To chain: ${txByHash.toChainId}`);
    } else {
      console.log('Transaction not found');
    }
    
    console.log('\n--- Test completed successfully ---');
  } catch (error) {
    console.error('Error in transaction service test:', error);
  } finally {
    // Cleanup and disconnect from database
    await transactionService.cleanup();
    await walletService.cleanup();
    console.log('Disconnected from database');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testTransactionService().catch(console.error);
}

export default testTransactionService; 