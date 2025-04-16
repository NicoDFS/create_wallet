import { Keypair } from '@solana/web3.js';
import * as crypto from 'crypto';
import bs58 from 'bs58';

export interface EncryptedSolanaWallet {
  address: string;
  encryptedPrivateKey: string;
  salt: string;
  iv: string;
}

class SolanaWalletGenerator {
  /**
   * Generate a new Solana wallet with encrypted private key
   * @param password - Password used to encrypt the private key
   * @returns EncryptedSolanaWallet object with address and encrypted details
   */
  static generateEncryptedWallet(password: string): EncryptedSolanaWallet {
    // Create a new Solana keypair
    const keypair = Keypair.generate();
    
    // Get the private key as Uint8Array
    const privateKeyBytes = keypair.secretKey;
    
    // Convert to string format for encryption
    const privateKeyString = bs58.encode(privateKeyBytes);

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
    let encryptedPrivateKey = cipher.update(privateKeyString, 'utf8', 'hex');
    encryptedPrivateKey += cipher.final('hex');

    return {
      address: keypair.publicKey.toBase58(),
      encryptedPrivateKey,
      salt,
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt the private key using the provided password
   * @param encryptedWallet - The encrypted wallet object
   * @param password - Password used to decrypt the private key
   * @returns Decrypted Solana keypair
   */
  static decryptWallet(encryptedWallet: EncryptedSolanaWallet, password: string): Keypair {
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
    let decryptedPrivateKeyString = decipher.update(encryptedWallet.encryptedPrivateKey, 'hex', 'utf8');
    decryptedPrivateKeyString += decipher.final('utf8');

    // Convert back to Uint8Array format
    const decryptedPrivateKeyBytes = bs58.decode(decryptedPrivateKeyString);

    // Create and return a Solana keypair from the decrypted private key
    return Keypair.fromSecretKey(decryptedPrivateKeyBytes);
  }

  /**
   * Example usage method
   */
  static example() {
    const password = 'MySecurePassword123!';
    
    // Generate an encrypted wallet
    const encryptedWallet = this.generateEncryptedWallet(password);
    console.log('Generated Solana Wallet Address:', encryptedWallet.address);

    // Decrypt the wallet
    try {
      const decryptedKeypair = this.decryptWallet(encryptedWallet, password);
      console.log('Decryption successful. Recovered Solana Address:', decryptedKeypair.publicKey.toBase58());
    } catch (error) {
      console.error('Decryption failed:', error);
    }

    return encryptedWallet;
  }
}

export default SolanaWalletGenerator; 