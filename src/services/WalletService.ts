import { DatabaseFactory } from '../db/DatabaseFactory';
import { IWalletDatabase, WalletRecord, DatabaseWalletData, CHAIN_IDS, CreateWalletData } from '../types/db';
import EthereumWalletGenerator from '../walletGenerator';
import BitcoinWalletGenerator from '../bitcoinWalletGenerator';
import SolanaWalletGenerator from '../solanaWalletGenerator';
import TronWalletGenerator from '../tronWalletGenerator';

/**
 * Service class for wallet operations
 * Provides methods for wallet generation, storage, and retrieval
 */
export class WalletService {
  private db: IWalletDatabase;
  
  constructor() {
    // Get database implementation from factory (real or mock)
    this.db = DatabaseFactory.createDatabase();
  }
  
  /**
   * Initialize the service and connect to the database
   */
  async init(): Promise<void> {
    await this.db.connect();
  }
  
  /**
   * Clean up resources and disconnect from the database
   */
  async cleanup(): Promise<void> {
    await this.db.disconnect();
  }
  
  /**
   * Generate wallets for a user and store them in the database
   * @param userId User identifier
   * @param password Password for encrypting wallet private keys
   * @param chainId Optional chain ID for EVM networks
   * @returns Object containing the created wallet records
   */
  async generateAndStoreWallets(
    userId: string, 
    password: string,
    chainId?: number
  ): Promise<DatabaseWalletData> {
    // Generate Ethereum wallet
    const ethWallet = EthereumWalletGenerator.generateEncryptedWallet(password);
    const ethWalletData: CreateWalletData = {
      walletType: 'ethereum',
      address: ethWallet.address,
      encryptedPrivateKey: ethWallet.encryptedPrivateKey,
      salt: ethWallet.salt,
      iv: ethWallet.iv,
      chainId: chainId || CHAIN_IDS.ETHEREUM_MAINNET // Default to Ethereum mainnet if no chain ID provided
    };
    const storedEthWallet = await this.db.createWallet(userId, ethWalletData);
    
    // Generate Bitcoin wallet
    const btcWallet = BitcoinWalletGenerator.generateEncryptedWallet(password);
    const btcWalletData: CreateWalletData = {
      walletType: 'bitcoin',
      address: btcWallet.address,
      encryptedPrivateKey: btcWallet.encryptedPrivateKey,
      salt: btcWallet.salt,
      iv: btcWallet.iv,
      network: btcWallet.network
    };
    const storedBtcWallet = await this.db.createWallet(userId, btcWalletData);
    
    // Generate Solana wallet
    const solWallet = SolanaWalletGenerator.generateEncryptedWallet(password);
    const solWalletData: CreateWalletData = {
      walletType: 'solana',
      address: solWallet.address,
      encryptedPrivateKey: solWallet.encryptedPrivateKey,
      salt: solWallet.salt,
      iv: solWallet.iv
    };
    const storedSolWallet = await this.db.createWallet(userId, solWalletData);
    
    // Generate Tron wallet
    const tronWallet = TronWalletGenerator.generateEncryptedWallet(password);
    const tronWalletData: CreateWalletData = {
      walletType: 'tron',
      address: tronWallet.address,
      encryptedPrivateKey: tronWallet.encryptedPrivateKey,
      salt: tronWallet.salt,
      iv: tronWallet.iv
    };
    const storedTronWallet = await this.db.createWallet(userId, tronWalletData);
    
    // Return wallet data
    return {
      ethereum: {
        ...ethWallet,
        chainId: ethWalletData.chainId
      },
      bitcoin: btcWallet,
      solana: solWallet,
      tron: tronWallet
    };
  }
  
  /**
   * Generate an Ethereum wallet for a specific chain ID
   * @param userId User identifier
   * @param password Password for encrypting wallet private key
   * @param chainId Chain ID for the specific EVM network
   * @returns Created Ethereum wallet record
   */
  async generateEthereumWallet(
    userId: string,
    password: string,
    chainId: number
  ): Promise<WalletRecord> {
    const ethWallet = EthereumWalletGenerator.generateEncryptedWallet(password);
    const walletData: CreateWalletData = {
      walletType: 'ethereum',
      address: ethWallet.address,
      encryptedPrivateKey: ethWallet.encryptedPrivateKey,
      salt: ethWallet.salt,
      iv: ethWallet.iv,
      chainId
    };
    
    return await this.db.createWallet(userId, walletData);
  }
  
  /**
   * Generate a Bitcoin wallet
   * @param userId User identifier
   * @param password Password for encrypting wallet private key
   * @param network Bitcoin network ('mainnet' or 'testnet')
   * @returns Created Bitcoin wallet record
   */
  async generateBitcoinWallet(
    userId: string,
    password: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<WalletRecord> {
    const btcWallet = BitcoinWalletGenerator.generateEncryptedWallet(password, network);
    const walletData: CreateWalletData = {
      walletType: 'bitcoin',
      address: btcWallet.address,
      encryptedPrivateKey: btcWallet.encryptedPrivateKey,
      salt: btcWallet.salt,
      iv: btcWallet.iv,
      network: btcWallet.network
    };
    
    return await this.db.createWallet(userId, walletData);
  }
  
  /**
   * Generate a Solana wallet
   * @param userId User identifier
   * @param password Password for encrypting wallet private key
   * @returns Created Solana wallet record
   */
  async generateSolanaWallet(
    userId: string,
    password: string
  ): Promise<WalletRecord> {
    const solWallet = SolanaWalletGenerator.generateEncryptedWallet(password);
    const walletData: CreateWalletData = {
      walletType: 'solana',
      address: solWallet.address,
      encryptedPrivateKey: solWallet.encryptedPrivateKey,
      salt: solWallet.salt,
      iv: solWallet.iv
    };
    
    return await this.db.createWallet(userId, walletData);
  }
  
  /**
   * Generate a Tron wallet
   * @param userId User identifier
   * @param password Password for encrypting wallet private key
   * @returns Created Tron wallet record
   */
  async generateTronWallet(
    userId: string,
    password: string
  ): Promise<WalletRecord> {
    const tronWallet = TronWalletGenerator.generateEncryptedWallet(password);
    const walletData: CreateWalletData = {
      walletType: 'tron',
      address: tronWallet.address,
      encryptedPrivateKey: tronWallet.encryptedPrivateKey,
      salt: tronWallet.salt,
      iv: tronWallet.iv
    };
    
    return await this.db.createWallet(userId, walletData);
  }
  
  /**
   * Get all wallets for a user
   * @param userId User identifier
   * @returns Array of wallet records
   */
  async getWallets(userId: string): Promise<WalletRecord[]> {
    return this.db.getWalletsByUser(userId);
  }
  
  /**
   * Get wallets for a specific chain ID
   * @param userId User identifier
   * @param chainId Chain ID to filter by
   * @returns Array of wallet records for the specified chain
   */
  async getWalletsByChain(userId: string, chainId: number): Promise<WalletRecord[]> {
    return this.db.getWalletsByChainId(userId, chainId);
  }
  
  /**
   * Get a wallet by address
   * @param userId User identifier
   * @param address Wallet address
   * @returns Wallet record or null if not found
   */
  async getWalletByAddress(userId: string, address: string): Promise<WalletRecord | null> {
    return this.db.getWallet(userId, address);
  }
  
  /**
   * Delete a wallet
   * @param walletId Wallet ID to delete
   * @returns True if deleted successfully
   */
  async deleteWallet(walletId: number): Promise<boolean> {
    return this.db.deleteWallet(walletId);
  }
  
  /**
   * Get all supported chain IDs
   * @returns Object mapping chain names to IDs
   */
  getChainIds(): typeof CHAIN_IDS {
    return CHAIN_IDS;
  }
} 