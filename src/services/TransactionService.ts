import { DatabaseFactory } from '../db/DatabaseFactory';
import { IWalletDatabase, TransactionRecord } from '../types/db';

/**
 * Service class for transaction operations
 * Provides methods for recording and retrieving transactions
 */
export class TransactionService {
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
   * Record a new transaction
   * @param walletId ID of the wallet involved in the transaction
   * @param transactionType Type of transaction ('send', 'receive', 'swap')
   * @param fromAddress Source address
   * @param toAddress Destination address
   * @param amount Transaction amount
   * @param currency Currency symbol (e.g., 'ETH', 'BTC')
   * @param fee Transaction fee
   * @param status Transaction status ('pending', 'completed', 'failed')
   * @param hash Transaction hash
   * @param chainId Optional chain ID for EVM networks
   * @param fromChainId Optional source chain ID for cross-chain transactions
   * @param toChainId Optional destination chain ID for cross-chain transactions
   * @returns Recorded transaction
   */
  async recordTransaction(
    walletId: number,
    transactionType: 'send' | 'receive' | 'swap',
    fromAddress: string,
    toAddress: string,
    amount: string,
    currency: string,
    fee: string,
    status: 'pending' | 'completed' | 'failed',
    hash: string,
    chainId?: number,
    fromChainId?: number,
    toChainId?: number
  ): Promise<TransactionRecord> {
    return this.db.recordTransaction({
      walletId,
      transactionType,
      fromAddress,
      toAddress,
      amount,
      currency,
      fee,
      status,
      hash,
      chainId,
      fromChainId,
      toChainId
    });
  }
  
  /**
   * Get all transactions for a wallet
   * @param walletId Wallet ID
   * @returns Array of transaction records
   */
  async getTransactionsByWallet(walletId: number): Promise<TransactionRecord[]> {
    return this.db.getTransactionsByWallet(walletId);
  }
  
  /**
   * Get all transactions for a user across all their wallets
   * @param userId User ID
   * @returns Array of transaction records
   */
  async getTransactionsByUser(userId: string): Promise<TransactionRecord[]> {
    return this.db.getTransactionsByUser(userId);
  }
  
  /**
   * Get a transaction by its hash
   * @param hash Transaction hash
   * @returns Transaction record or null if not found
   */
  async getTransactionByHash(hash: string): Promise<TransactionRecord | null> {
    return this.db.getTransactionsByHash(hash);
  }
  
  /**
   * Update a transaction's status
   * @param id Transaction ID
   * @param status New status
   * @returns True if updated successfully
   */
  async updateTransactionStatus(
    id: number,
    status: 'pending' | 'completed' | 'failed'
  ): Promise<boolean> {
    return this.db.updateTransaction(id, { status });
  }
  
  /**
   * Update a transaction's hash
   * @param id Transaction ID
   * @param hash New transaction hash
   * @returns True if updated successfully
   */
  async updateTransactionHash(id: number, hash: string): Promise<boolean> {
    return this.db.updateTransaction(id, { hash });
  }
  
  /**
   * Update a transaction's fee
   * @param id Transaction ID
   * @param fee New transaction fee
   * @returns True if updated successfully
   */
  async updateTransactionFee(id: number, fee: string): Promise<boolean> {
    return this.db.updateTransaction(id, { fee });
  }
} 