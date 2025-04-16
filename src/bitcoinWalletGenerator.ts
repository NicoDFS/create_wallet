import * as bitcoin from 'bitcoinjs-lib';
import * as crypto from 'crypto';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';

const ECPair = ECPairFactory(ecc);

// Custom RNG for Node.js environment
const rng = (size?: number): Uint8Array => {
  const bytes = crypto.randomBytes(size || 32);
  return Uint8Array.from(bytes);
};

export interface EncryptedBitcoinWallet {
  address: string;
  encryptedPrivateKey: string;
  salt: string;
  iv: string;
  network: 'mainnet' | 'testnet';
}

class BitcoinWalletGenerator {
  /**
   * Generate a new Bitcoin wallet with encrypted private key
   * @param password - Password used to encrypt the private key
   * @param network - 'mainnet' or 'testnet'
   * @returns EncryptedBitcoinWallet object with address and encrypted details
   */
  static generateEncryptedWallet(
    password: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): EncryptedBitcoinWallet {
    // Set the network
    const bitcoinNetwork = network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;

    // Generate a new key pair
    const keyPair = ECPair.makeRandom({ network: bitcoinNetwork, rng });
    const { address } = bitcoin.payments.p2pkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: bitcoinNetwork,
    });

    // Get private key in WIF format
    const privateKeyWIF = keyPair.toWIF();

    // Generate a cryptographically secure salt
    const salt = crypto.randomBytes(16).toString('hex');

    // Generate an initialization vector
    const iv = crypto.randomBytes(16);

    // Derive an encryption key from the password using PBKDF2
    const key = crypto.pbkdf2Sync(
      password,
      salt,
      100000, // iterations
      32,      // key length
      'sha256' // hash algorithm
    );

    // Create a cipher using AES-256-CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    // Encrypt the private key
    let encryptedPrivateKey = cipher.update(privateKeyWIF, 'utf8', 'hex');
    encryptedPrivateKey += cipher.final('hex');

    return {
      address: address!,
      encryptedPrivateKey,
      salt,
      iv: iv.toString('hex'),
      network
    };
  }

  /**
   * Decrypt the private key using the provided password
   * @param encryptedWallet - The encrypted wallet object
   * @param password - Password used to decrypt the private key
   * @returns Decrypted Bitcoin key pair
   */
  static decryptWallet(
    encryptedWallet: EncryptedBitcoinWallet,
    password: string
  ): any {
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
    let decryptedPrivateKeyWIF = decipher.update(encryptedWallet.encryptedPrivateKey, 'hex', 'utf8');
    decryptedPrivateKeyWIF += decipher.final('utf8');

    // Create and return a key pair from the decrypted private key
    const network = encryptedWallet.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
    return ECPair.fromWIF(decryptedPrivateKeyWIF, network);
  }

  /**
   * Example usage method
   */
  static example() {
    const password = 'MySecurePassword123!';
    
    // Generate an encrypted wallet
    const encryptedWallet = this.generateEncryptedWallet(password);
    console.log('Generated Bitcoin Wallet Address:', encryptedWallet.address);

    // Decrypt the wallet
    try {
      const decryptedKeyPair = this.decryptWallet(encryptedWallet, password);
      const { address } = bitcoin.payments.p2pkh({
        pubkey: Buffer.from(decryptedKeyPair.publicKey),
        network: encryptedWallet.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet,
      });
      console.log('Decryption successful. Recovered Bitcoin Address:', address);
    } catch (error) {
      console.error('Decryption failed:', error);
    }

    return encryptedWallet;
  }
}

export default BitcoinWalletGenerator; 