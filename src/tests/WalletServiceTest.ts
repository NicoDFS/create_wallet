import { WalletService } from '../services/WalletService';
import { CHAIN_IDS } from '../types/db';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Test for WalletService functionality
 * This test demonstrates the database integration with the wallet service
 */
async function testWalletService() {
  console.log('=== WALLET SERVICE TEST ===');
  
  // Create a WalletService instance
  const walletService = new WalletService();
  
  try {
    // Initialize and connect to the database
    await walletService.init();
    console.log('Connected to database');
    
    // Generate wallets for a test user
    const userId = 'test-user-' + Date.now();
    const password = 'TestPassword123!';
    
    console.log(`Generating wallets for user: ${userId}`);
    const wallets = await walletService.generateAndStoreWallets(userId, password);
    
    console.log('\n--- Generated Wallets ---');
    console.log('Ethereum Address:', wallets.ethereum?.address);
    console.log('Bitcoin Address:', wallets.bitcoin?.address);
    console.log('Solana Address:', wallets.solana?.address);
    console.log('Tron Address:', wallets.tron?.address);
    
    // Retrieve wallets from database
    console.log('\n--- Retrieving Wallets from Database ---');
    const storedWallets = await walletService.getWallets(userId);
    console.log(`Found ${storedWallets.length} wallets for user ${userId}`);
    
    storedWallets.forEach(wallet => {
      console.log(`${wallet.walletType.toUpperCase()} Address: ${wallet.address}`);
      if (wallet.chainId) {
        console.log(`Chain ID: ${wallet.chainId}`);
      }
      if (wallet.network) {
        console.log(`Network: ${wallet.network}`);
      }
    });
    
    // Generate an Ethereum wallet for a specific chain
    console.log('\n--- Generating Ethereum Wallet for Polygon Network ---');
    const polygonWallet = await walletService.generateEthereumWallet(
      userId,
      password,
      CHAIN_IDS.POLYGON_MAINNET
    );
    
    console.log(`Polygon Wallet Address: ${polygonWallet.address}`);
    console.log(`Polygon Chain ID: ${polygonWallet.chainId}`);
    
    // Get wallets by chain ID
    console.log('\n--- Retrieving Ethereum Wallets by Chain ID ---');
    const ethereumWallets = await walletService.getWalletsByChain(userId, CHAIN_IDS.ETHEREUM_MAINNET);
    console.log(`Found ${ethereumWallets.length} Ethereum mainnet wallets`);
    
    const polygonWallets = await walletService.getWalletsByChain(userId, CHAIN_IDS.POLYGON_MAINNET);
    console.log(`Found ${polygonWallets.length} Polygon mainnet wallets`);
    
    // Get wallet by address
    console.log('\n--- Retrieving Wallet by Address ---');
    const walletByAddress = await walletService.getWalletByAddress(userId, wallets.ethereum?.address || '');
    
    if (walletByAddress) {
      console.log(`Found wallet with address ${walletByAddress.address}`);
      console.log(`Wallet type: ${walletByAddress.walletType}`);
      console.log(`Chain ID: ${walletByAddress.chainId || 'N/A'}`);
    } else {
      console.log('Wallet not found');
    }
    
    console.log('\n--- Test completed successfully ---');
  } catch (error) {
    console.error('Error in wallet service test:', error);
  } finally {
    // Cleanup and disconnect from database
    await walletService.cleanup();
    console.log('Disconnected from database');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testWalletService().catch(console.error);
}

export default testWalletService; 