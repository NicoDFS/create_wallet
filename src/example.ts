import WalletManager from './index';
import EthereumWalletGenerator from './walletGenerator';
import BitcoinWalletGenerator from './bitcoinWalletGenerator';
import SolanaWalletGenerator from './solanaWalletGenerator';
import TronWalletGenerator from './tronWalletGenerator';

// Demo using the unified WalletManager
function demoWalletManager() {
  console.log('\n========= WALLET MANAGER DEMO =========\n');
  
  const password = 'MySecurePassword123!';
  const wallets = WalletManager.generateWallets(password);
  
  console.log('\n--- Encrypted Wallet Data ---');
  console.log('\nEthereum:');
  console.log(`Address: ${wallets.ethereum.address}`);
  console.log(`Encrypted Private Key: ${wallets.ethereum.encryptedPrivateKey.slice(0, 20)}...`);
  
  console.log('\nBitcoin:');
  console.log(`Address: ${wallets.bitcoin.address}`);
  console.log(`Network: ${wallets.bitcoin.network}`);
  console.log(`Encrypted Private Key: ${wallets.bitcoin.encryptedPrivateKey.slice(0, 20)}...`);
  
  console.log('\nSolana:');
  console.log(`Address: ${wallets.solana.address}`);
  console.log(`Encrypted Private Key: ${wallets.solana.encryptedPrivateKey.slice(0, 20)}...`);
  
  console.log('\nTron:');
  console.log(`Address: ${wallets.tron.address}`);
  console.log(`Encrypted Private Key: ${wallets.tron.encryptedPrivateKey.slice(0, 20)}...`);
  
  // Decrypt and verify all wallets
  WalletManager.decryptWallets(
    wallets.ethereum, 
    wallets.bitcoin, 
    wallets.solana, 
    wallets.tron,
    password
  );
}

// Demo using individual wallet generators
function demoIndividualWallets() {
  console.log('\n========= INDIVIDUAL WALLET GENERATORS DEMO =========\n');
  
  const password = 'AnotherSecurePassword456!';
  
  // Ethereum
  console.log('\n--- Ethereum Wallet ---');
  const ethWallet = EthereumWalletGenerator.generateEncryptedWallet(password);
  console.log(`Address: ${ethWallet.address}`);
  const decryptedEthWallet = EthereumWalletGenerator.decryptWallet(ethWallet, password);
  console.log(`Decrypted Address (verification): ${decryptedEthWallet.address}`);
  
  // Bitcoin - Mainnet
  console.log('\n--- Bitcoin Mainnet Wallet ---');
  const btcWallet = BitcoinWalletGenerator.generateEncryptedWallet(password);
  console.log(`Address: ${btcWallet.address}`);
  BitcoinWalletGenerator.decryptWallet(btcWallet, password);
  console.log('Successfully decrypted Bitcoin wallet');
  
  // Bitcoin - Testnet
  console.log('\n--- Bitcoin Testnet Wallet ---');
  const testnetWallet = BitcoinWalletGenerator.generateEncryptedWallet(password, 'testnet');
  console.log(`Address: ${testnetWallet.address}`);
  console.log(`Network: ${testnetWallet.network}`);
  
  // Solana
  console.log('\n--- Solana Wallet ---');
  const solWallet = SolanaWalletGenerator.generateEncryptedWallet(password);
  console.log(`Address: ${solWallet.address}`);
  const decryptedSolWallet = SolanaWalletGenerator.decryptWallet(solWallet, password);
  console.log(`Decrypted Address (verification): ${decryptedSolWallet.publicKey.toBase58()}`);
  
  // Tron
  console.log('\n--- Tron Wallet ---');
  const tronWallet = TronWalletGenerator.generateEncryptedWallet(password);
  console.log(`Address: ${tronWallet.address}`);
  const decryptedTronWallet = TronWalletGenerator.decryptWallet(tronWallet, password);
  console.log(`Decrypted Address (verification): ${decryptedTronWallet.address}`);
}

// Run demos
console.log('===============================================');
console.log('  MULTI-BLOCKCHAIN WALLET GENERATOR EXAMPLES');
console.log('===============================================');

demoWalletManager();
demoIndividualWallets();

console.log('\n===============================================');
console.log('  DEMO COMPLETE');
console.log('==============================================='); 