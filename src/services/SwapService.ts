import { DatabaseFactory } from '../db/DatabaseFactory';
import { IWalletDatabase, WalletRecord, TransactionRecord } from '../types/db';
import { ChangeNowAPI, SwapTransaction, SwapRate, SwapStatus } from '../api/ChangeNowAPI';

/**
 * Service class for token swap operations
 * Provides methods for swap rate estimation, transaction creation, and swap status tracking
 */
export class SwapService {
  private db: IWalletDatabase;
  private api: ChangeNowAPI;
  
  constructor(useMock?: boolean) {
    // Get database implementation from factory (real or mock)
    this.db = DatabaseFactory.createDatabase();
    
    // Initialize ChangeNow API client (use mock if specified or if API_MOCK=true in .env)
    this.api = new ChangeNowAPI({ useMock });
  }
  
  /**
   * Initialize the service (connect to database)
   */
  async init(): Promise<void> {
    await this.db.connect();
  }
  
  /**
   * Cleanup resources (disconnect from database)
   */
  async cleanup(): Promise<void> {
    await this.db.disconnect();
  }
  
  /**
   * Get estimated exchange rate for a token swap
   * @param fromCurrency Source currency ticker
   * @param toCurrency Target currency ticker
   * @param amount Amount to exchange in source currency
   * @param fromChainId Optional chain ID for EVM source network
   * @param toChainId Optional chain ID for EVM target network
   * @returns Promise with estimated swap rate data
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    amount: string,
    fromChainId?: number,
    toChainId?: number
  ): Promise<SwapRate> {
    return this.api.getExchangeRate(fromCurrency, toCurrency, amount, fromChainId, toChainId);
  }
  
  /**
   * Create and record a new swap transaction
   * @param walletId ID of the source wallet
   * @param fromCurrency Source currency ticker
   * @param toCurrency Target currency ticker
   * @param fromAmount Amount to exchange in source currency
   * @param toAddress Target wallet address to receive exchanged currency
   * @param refundAddress Refund address in case of failed transaction
   * @param fromChainId Optional chain ID for EVM source network
   * @param toChainId Optional chain ID for EVM target network
   * @returns Promise with created transaction record
   */
  async createSwap(
    walletId: number,
    fromCurrency: string,
    toCurrency: string,
    fromAmount: string,
    toAddress: string,
    refundAddress: string,
    fromChainId?: number,
    toChainId?: number
  ): Promise<TransactionRecord> {
    try {
      // Get wallet details from database
      const wallet = await this.db.getWalletById(walletId);
      if (!wallet) {
        throw new Error(`Wallet with ID ${walletId} not found`);
      }
      
      // Create swap transaction with ChangeNow API
      const swap = await this.api.createTransaction(
        fromCurrency,
        toCurrency,
        fromAmount,
        toAddress,
        refundAddress,
        fromChainId,
        toChainId
      );
      
      // Get estimated exchange rate for expected output amount
      const rateData = await this.api.getExchangeRate(
        fromCurrency,
        toCurrency,
        fromAmount,
        fromChainId,
        toChainId
      );
      
      // Record transaction in database
      const transaction = await this.db.recordTransaction({
        walletId,
        transactionType: 'swap',
        fromAddress: wallet.address,
        toAddress,
        amount: fromAmount,
        currency: fromCurrency,
        fee: rateData.fee,
        status: 'pending',
        hash: swap.id, // Use ChangeNow transaction ID as hash
        chainId: fromChainId,
        fromChainId,
        toChainId
      });
      
      return transaction;
    } catch (error: any) {
      console.error('Error creating swap transaction:', error);
      throw new Error(`Failed to create swap: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Get status of an existing swap transaction
   * @param transactionId ChangeNow transaction ID
   * @returns Promise with transaction status
   */
  async getSwapStatus(transactionId: string): Promise<SwapStatus> {
    return this.api.getTransactionStatus(transactionId);
  }
  
  /**
   * Update status of a swap transaction in the database
   * @param transactionId Database transaction ID
   * @param status New transaction status
   * @returns True if update was successful
   */
  async updateSwapStatus(
    transactionId: number,
    status: 'pending' | 'completed' | 'failed'
  ): Promise<boolean> {
    return this.db.updateTransaction(transactionId, { status });
  }
  
  /**
   * Check and update status of all pending swap transactions
   * @returns Number of transactions updated
   */
  async updatePendingSwaps(): Promise<number> {
    let updatedCount = 0;
    
    try {
      // Get all transactions with 'swap' type and 'pending' status
      const pendingSwaps = await this.db.getTransactionsByStatus('pending');
      
      for (const swap of pendingSwaps.filter((tx: TransactionRecord) => tx.transactionType === 'swap')) {
        try {
          // Check status with ChangeNow API
          const swapStatus = await this.api.getTransactionStatus(swap.hash);
          
          // Map ChangeNow status to our database status
          let newStatus: 'pending' | 'completed' | 'failed';
          
          if (swapStatus.status === 'finished') {
            newStatus = 'completed';
          } else if (swapStatus.status === 'failed' || swapStatus.status === 'refunded') {
            newStatus = 'failed';
          } else {
            newStatus = 'pending';
          }
          
          // Only update if status changed
          if (newStatus !== 'pending') {
            const updated = await this.db.updateTransaction(swap.id, { 
              status: newStatus
            });
            
            if (updated) {
              updatedCount++;
            }
          }
        } catch (error) {
          console.error(`Error updating swap ${swap.id}:`, error);
          // Continue with other swaps even if one fails
        }
      }
      
      return updatedCount;
    } catch (error: any) {
      console.error('Error updating pending swaps:', error);
      throw new Error(`Failed to update pending swaps: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Get all swap transactions for a wallet
   * @param walletId Wallet ID
   * @returns Promise with array of swap transactions
   */
  async getSwapsByWallet(walletId: number): Promise<TransactionRecord[]> {
    const transactions = await this.db.getTransactionsByWallet(walletId);
    return transactions.filter((tx: TransactionRecord) => tx.transactionType === 'swap');
  }
  
  /**
   * Get all swap transactions for a user across all their wallets
   * @param userId User ID
   * @returns Promise with array of swap transactions
   */
  async getSwapsByUser(userId: string): Promise<TransactionRecord[]> {
    const transactions = await this.db.getTransactionsByUser(userId);
    return transactions.filter((tx: TransactionRecord) => tx.transactionType === 'swap');
  }
} 