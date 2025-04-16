import { WalletService } from './services/WalletService';
import { TransactionService } from './services/TransactionService';
import { CHAIN_IDS } from './types/db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Example script demonstrating wallet and transaction operations with database integration
 */
async function runDatabaseExample() {
  console.log('===============================================');
  console.log('  WALLET & TRANSACTION DATABASE EXAMPLE');
  console.log('===============================================');
  
  // Create service instances
  const walletService = new WalletService();
  const transactionService = new TransactionService();
  
  try {
    // Initialize and connect to the database
    await walletService.init();
    await transactionService.init();
    console.log('Connected to database');
    
    // Display supported chain IDs
    console.log('\n=== Supported Chain IDs ===');
    const chainIds = walletService.getChainIds();
    
    Object.entries(chainIds).forEach(([name, id]) => {
      console.log(`${name}: ${id}`);
    });
    
    // Generate wallets for a demo user
    const userId = 'demo-user-' + Date.now();
    const password = 'SecurePassword123!';
    
    console.log(`\n=== Generating Wallets for User: ${userId} ===`);
    const wallets = await walletService.generateAndStoreWallets(userId, password);
    
    console.log('\n--- Generated Wallets ---');
    console.log('Ethereum Address:', wallets.ethereum?.address);
    console.log('Bitcoin Address:', wallets.bitcoin?.address);
    console.log('Solana Address:', wallets.solana?.address);
    console.log('Tron Address:', wallets.tron?.address);
    
    // Generate an Ethereum wallet for Polygon
    console.log('\n=== Generating Ethereum Wallet for Polygon ===');
    const polygonWallet = await walletService.generateEthereumWallet(
      userId,
      password,
      CHAIN_IDS.POLYGON_MAINNET
    );
    
    console.log('Polygon Wallet Address:', polygonWallet.address);
    console.log('Chain ID:', polygonWallet.chainId);
    
    // Retrieve all wallets for the user
    console.log('\n=== Retrieving All Wallets for User ===');
    const storedWallets = await walletService.getWallets(userId);
    
    console.log(`Found ${storedWallets.length} wallets for user ${userId}`);
    
    storedWallets.forEach(wallet => {
      console.log(`- ${wallet.walletType.toUpperCase()}: ${wallet.address}`);
      if (wallet.chainId) {
        console.log(`  Chain ID: ${wallet.chainId}`);
      }
      if (wallet.network) {
        console.log(`  Network: ${wallet.network}`);
      }
    });
    
    // Record a transaction
    console.log('\n=== Recording Transactions ===');
    
    // Find Ethereum wallet
    const ethWallet = storedWallets.find(w => w.walletType === 'ethereum');
    
    if (ethWallet) {
      const transaction = await transactionService.recordTransaction(
        ethWallet.id,
        'receive',
        '0x1111222233334444555566667777888899990000', // From address
        ethWallet.address, // To address
        '1.5', // Amount
        'ETH', // Currency
        '0.002', // Fee
        'completed', // Status
        '0xabcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yz567890abcdef', // Hash
        ethWallet.chainId, // Chain ID
      );
      
      console.log('Transaction recorded:', {
        id: transaction.id,
        type: transaction.transactionType,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status
      });
      
      // Record a cross-chain swap transaction
      const swapTransaction = await transactionService.recordTransaction(
        ethWallet.id,
        'swap',
        ethWallet.address, // From address
        polygonWallet.address, // To address
        '100', // Amount
        'USDT', // Currency
        '2.5', // Fee
        'completed', // Status
        '0xswap0987swap6543swap2109swap8765swap4321swap0987swap6543', // Hash
        ethWallet.chainId, // Chain ID
        CHAIN_IDS.ETHEREUM_MAINNET, // From Chain ID
        CHAIN_IDS.POLYGON_MAINNET // To Chain ID
      );
      
      console.log('Cross-chain swap recorded:', {
        id: swapTransaction.id,
        type: swapTransaction.transactionType,
        fromChain: swapTransaction.fromChainId,
        toChain: swapTransaction.toChainId,
        amount: swapTransaction.amount,
        currency: swapTransaction.currency
      });
      
      // Get transactions for wallet
      console.log('\n=== Retrieving Transactions ===');
      const transactions = await transactionService.getTransactionsByWallet(ethWallet.id);
      
      console.log(`Found ${transactions.length} transactions for wallet ${ethWallet.address}`);
      
      transactions.forEach(tx => {
        console.log(`- ${tx.transactionType} ${tx.amount} ${tx.currency} (${tx.status})`);
        if (tx.transactionType === 'swap') {
          console.log(`  From chain: ${tx.fromChainId}, To chain: ${tx.toChainId}`);
        }
      });
    }
    
    console.log('\n===============================================');
    console.log('  DATABASE EXAMPLE COMPLETE');
    console.log('===============================================');
  } catch (error) {
    console.error('Error in database example:', error);
  } finally {
    // Clean up and disconnect
    await transactionService.cleanup();
    await walletService.cleanup();
    console.log('Disconnected from database');
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runDatabaseExample().catch(console.error);
}

export default runDatabaseExample; 