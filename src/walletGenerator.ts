import { ethers } from 'ethers';
import * as crypto from 'crypto';

export interface EncryptedWallet {
  address: string;
  encryptedPrivateKey: string;
  salt: string;
  iv: string;
}

class EthereumWalletGenerator {
  /**
   * Generate a new Ethereum wallet with encrypted private key
   * @param password - Password used to encrypt the private key
   * @returns EncryptedWallet object with address and encrypted details
   */
  static generateEncryptedWallet(password: string): EncryptedWallet {
    // Create a new Ethereum wallet
    const wallet = ethers.Wallet.createRandom();

    // Generate a cryptographically secure salt
    const salt = crypto.randomBytes(16).toString('hex');

    // Generate an initialization vector
    const iv = crypto.randomBytes(16);

    // Derive an encryption key from the password using PBKDF2
    const key = crypto.pbkdf2Sync(
      password, 
      salt, 
      100000,  // iterations
      32,      // key length
      'sha256' // hash algorithm
    );

    // Create a cipher using AES-256-CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    // Encrypt the private key
    let encryptedPrivateKey = cipher.update(wallet.privateKey, 'utf8', 'hex');
    encryptedPrivateKey += cipher.final('hex');

    return {
      address: wallet.address,
      encryptedPrivateKey,
      salt,
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt the private key using the provided password
   * @param encryptedWallet - The encrypted wallet object
   * @param password - Password used to decrypt the private key
   * @returns Decrypted Ethereum wallet
   */
  static decryptWallet(encryptedWallet: EncryptedWallet, password: string): ethers.Wallet {
    // Derive the key using the same method as encryption
    const key = crypto.pbkdf2Sync(
      password, 
      encryptedWallet.salt, 
      100000, 
      32, 
      'sha256'
    );

    // Create a decipher
    const iv = Buffer.from(encryptedWallet.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    // Decrypt the private key
    let decryptedPrivateKey = decipher.update(encryptedWallet.encryptedPrivateKey, 'hex', 'utf8');
    decryptedPrivateKey += decipher.final('utf8');

    // Create and return a wallet from the decrypted private key
    return new ethers.Wallet(decryptedPrivateKey);
  }

  /**
   * Example usage method
   */
  static example() {
    const password = 'MySecurePassword123!';
    
    // Generate an encrypted wallet
    const encryptedWallet = this.generateEncryptedWallet(password);
    console.log('Generated Wallet Address:', encryptedWallet.address);

    // Decrypt the wallet
    try {
      const decryptedWallet = this.decryptWallet(encryptedWallet, password);
      console.log('Decryption successful. Recovered Address:', decryptedWallet.address);
    } catch (error) {
      console.error('Decryption failed:', error);
    }

    return encryptedWallet;
  }
}

export default EthereumWalletGenerator;
