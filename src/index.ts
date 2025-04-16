import EthereumWalletGenerator, { EncryptedWallet } from './walletGenerator';
import BitcoinWalletGenerator, { EncryptedBitcoinWallet } from './bitcoinWalletGenerator';
import SolanaWalletGenerator, { EncryptedSolanaWallet } from './solanaWalletGenerator';
import TronWalletGenerator, { EncryptedTronWallet } from './tronWalletGenerator';

class WalletManager {
  static generateWallets(password: string): { 
    ethereum: EncryptedWallet; 
    bitcoin: EncryptedBitcoinWallet;
    solana: EncryptedSolanaWallet;
    tron: EncryptedTronWallet;
  } {
    console.log('\n=== Generating Ethereum Wallet ===');
    const ethWallet = EthereumWalletGenerator.generateEncryptedWallet(password);
    console.log('Ethereum Address:', ethWallet.address);

    console.log('\n=== Generating Bitcoin Wallet ===');
    const btcWallet = BitcoinWalletGenerator.generateEncryptedWallet(password);
    console.log('Bitcoin Address:', btcWallet.address);
    console.log('Network:', btcWallet.network);

    console.log('\n=== Generating Solana Wallet ===');
    const solWallet = SolanaWalletGenerator.generateEncryptedWallet(password);
    console.log('Solana Address:', solWallet.address);

    console.log('\n=== Generating Tron Wallet ===');
    const tronWallet = TronWalletGenerator.generateEncryptedWallet(password);
    console.log('Tron Address:', tronWallet.address);

    return {
      ethereum: ethWallet,
      bitcoin: btcWallet,
      solana: solWallet,
      tron: tronWallet
    };
  }

  static decryptWallets(
    ethWallet: EncryptedWallet,
    btcWallet: EncryptedBitcoinWallet,
    solWallet: EncryptedSolanaWallet,
    tronWallet: EncryptedTronWallet,
    password: string
  ) {
    console.log('\n=== Decrypting Ethereum Wallet ===');
    try {
      const decryptedEthWallet = EthereumWalletGenerator.decryptWallet(ethWallet, password);
      console.log('Recovered Ethereum Address:', decryptedEthWallet.address);
    } catch (error) {
      console.error('Failed to decrypt Ethereum wallet:', error);
    }

    console.log('\n=== Decrypting Bitcoin Wallet ===');
    try {
      const decryptedBtcKeyPair = BitcoinWalletGenerator.decryptWallet(btcWallet, password);
      console.log('Bitcoin Wallet Decrypted Successfully');
    } catch (error) {
      console.error('Failed to decrypt Bitcoin wallet:', error);
    }

    console.log('\n=== Decrypting Solana Wallet ===');
    try {
      const decryptedSolKeypair = SolanaWalletGenerator.decryptWallet(solWallet, password);
      console.log('Recovered Solana Address:', decryptedSolKeypair.publicKey.toBase58());
    } catch (error) {
      console.error('Failed to decrypt Solana wallet:', error);
    }

    console.log('\n=== Decrypting Tron Wallet ===');
    try {
      const decryptedTronWallet = TronWalletGenerator.decryptWallet(tronWallet, password);
      console.log('Recovered Tron Address:', decryptedTronWallet.address);
    } catch (error) {
      console.error('Failed to decrypt Tron wallet:', error);
    }
  }
}

// Example usage
const password = 'MySecurePassword123!';
console.log('=== Creating New Wallets ===');
const wallets = WalletManager.generateWallets(password);

// Test decryption
console.log('\n=== Testing Wallet Decryption ===');
WalletManager.decryptWallets(
  wallets.ethereum, 
  wallets.bitcoin, 
  wallets.solana, 
  wallets.tron, 
  password
);

export default WalletManager;
