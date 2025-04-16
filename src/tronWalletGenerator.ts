// Import TronWeb using require for compatibility
const TronWebModule = require('tronweb');
import * as crypto from 'crypto';

export interface EncryptedTronWallet {
  address: string;
  encryptedPrivateKey: string;
  salt: string;
  iv: string;
}

class TronWalletGenerator {
  /**
   * Generate a new Tron wallet with encrypted private key
   * @param password - Password used to encrypt the private key
   * @returns EncryptedTronWallet object with address and encrypted details
   */
  static generateEncryptedWallet(password: string): EncryptedTronWallet {
    // Create a new Tron account using static utility
    const account = TronWebModule.utils.accounts.generateAccount();
    const privateKey = account.privateKey;
    const address = account.address.base58;

    // Validate the Tron address format
    if (!this.validateTronAddress(address)) {
      throw new Error('Generated address is invalid');
    }

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
    let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex');
    encryptedPrivateKey += cipher.final('hex');

    return {
      address,
      encryptedPrivateKey,
      salt,
      iv: iv.toString('hex')
    };
  }

  /**
   * Validates a Tron address format
   * @param address - The Tron address to validate
   * @returns Boolean indicating if the address is valid
   */
  static validateTronAddress(address: string): boolean {
    // Tron addresses always start with 'T' and are 34 characters long (Base58)
    if (!address || !address.startsWith('T') || address.length !== 34) {
      return false;
    }

    // Check if address contains only valid Base58 characters
    const base58Chars = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
    return base58Chars.test(address);
  }

  /**
   * Decrypt the private key using the provided password
   * @param encryptedWallet - The encrypted wallet object
   * @param password - Password used to decrypt the private key
   * @returns Tron account with address and private key
   */
  static decryptWallet(encryptedWallet: EncryptedTronWallet, password: string): { address: string; privateKey: string } {
    // First validate the address format
    if (!this.validateTronAddress(encryptedWallet.address)) {
      throw new Error('Invalid Tron address format');
    }

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

    // Return the validated address and decrypted private key
    return {
      address: encryptedWallet.address,
      privateKey: decryptedPrivateKey
    };
  }

  /**
   * Example usage method
   */
  static example() {
    const password = 'MySecurePassword123!';
    
    // Generate an encrypted wallet
    const encryptedWallet = this.generateEncryptedWallet(password);
    console.log('Generated Tron Wallet Address:', encryptedWallet.address);
    console.log('Address valid:', this.validateTronAddress(encryptedWallet.address));

    // Decrypt the wallet
    try {
      const decryptedWallet = this.decryptWallet(encryptedWallet, password);
      console.log('Decryption successful. Recovered Tron Address:', decryptedWallet.address);
    } catch (error) {
      console.error('Decryption failed:', error);
    }

    return encryptedWallet;
  }
}

export default TronWalletGenerator; 