import { 
  IWalletDatabase, 
  WalletRecord, 
  TransactionRecord, 
  CreateWalletData 
} from '../types/db';

/**
 * Mock implementation of the database for local testing
 * This allows development without a real MySQL database
 */
export class MockDatabase implements IWalletDatabase {
  private wallets: WalletRecord[] = [];
  private transactions: TransactionRecord[] = [];
  private walletIdCounter = 1;
  private transactionIdCounter = 1;
  private connected = false;

  /**
   * Mock connection - simulates connecting to a database
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }
    
    console.log('MockDatabase: Connected to mock database');
    this.connected = true;
    
    // Add some test data if needed
    if (process.env.NODE_ENV === 'development' && this.wallets.length === 0) {
      this.seedTestData();
    }
  }

  /**
   * Mock disconnection
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }
    
    console.log('MockDatabase: Disconnected from mock database');
    this.connected = false;
  }

  /**
   * Create a new wallet in the mock database
   */
  async createWallet(userId: string, walletData: CreateWalletData): Promise<WalletRecord> {
    this.ensureConnected();
    
    const wallet: WalletRecord = {
      id: this.walletIdCounter++,
      userId,
      walletType: walletData.walletType,
      address: walletData.address,
      encryptedPrivateKey: walletData.encryptedPrivateKey,
      salt: walletData.salt,
      iv: walletData.iv,
      network: walletData.network,
      chainId: walletData.chainId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.wallets.push(wallet);
    return wallet;
  }

  /**
   * Get a wallet by user ID and address
   */
  async getWallet(userId: string, address: string): Promise<WalletRecord | null> {
    this.ensureConnected();
    
    const wallet = this.wallets.find(w => 
      w.userId === userId && 
      w.address.toLowerCase() === address.toLowerCase()
    );
    
    return wallet || null;
  }

  /**
   * Get a wallet by its ID
   */
  async getWalletById(walletId: number): Promise<WalletRecord | null> {
    this.ensureConnected();
    
    const wallet = this.wallets.find(w => w.id === walletId);
    return wallet || null;
  }

  /**
   * Get all wallets for a user
   */
  async getWalletsByUser(userId: string): Promise<WalletRecord[]> {
    this.ensureConnected();
    
    return this.wallets.filter(w => w.userId === userId);
  }

  /**
   * Get wallets by chain ID for a specific user
   */
  async getWalletsByChainId(userId: string, chainId: number): Promise<WalletRecord[]> {
    this.ensureConnected();
    
    return this.wallets.filter(w => 
      w.userId === userId && 
      w.chainId === chainId
    );
  }

  /**
   * Update wallet information
   */
  async updateWallet(walletId: number, data: Partial<WalletRecord>): Promise<boolean> {
    this.ensureConnected();
    
    const index = this.wallets.findIndex(w => w.id === walletId);
    if (index === -1) {
      return false;
    }
    
    this.wallets[index] = {
      ...this.wallets[index],
      ...data,
      updatedAt: new Date()
    };
    
    return true;
  }

  /**
   * Delete a wallet
   */
  async deleteWallet(walletId: number): Promise<boolean> {
    this.ensureConnected();
    
    const initialLength = this.wallets.length;
    this.wallets = this.wallets.filter(w => w.id !== walletId);
    
    return this.wallets.length !== initialLength;
  }

  /**
   * Record a new transaction
   */
  async recordTransaction(transactionData: Omit<TransactionRecord, 'id' | 'timestamp'>): Promise<TransactionRecord> {
    this.ensureConnected();
    
    const transaction: TransactionRecord = {
      ...transactionData,
      id: this.transactionIdCounter++,
      timestamp: new Date()
    };
    
    this.transactions.push(transaction);
    return transaction;
  }

  /**
   * Get all transactions for a wallet
   */
  async getTransactionsByWallet(walletId: number): Promise<TransactionRecord[]> {
    this.ensureConnected();
    
    return this.transactions.filter(t => t.walletId === walletId);
  }

  /**
   * Get all transactions for a user across all their wallets
   */
  async getTransactionsByUser(userId: string): Promise<TransactionRecord[]> {
    this.ensureConnected();
    
    const userWalletIds = this.wallets
      .filter(w => w.userId === userId)
      .map(w => w.id);
    
    return this.transactions.filter(t => userWalletIds.includes(t.walletId));
  }

  /**
   * Get a transaction by its hash
   */
  async getTransactionsByHash(hash: string): Promise<TransactionRecord | null> {
    this.ensureConnected();
    
    const transaction = this.transactions.find(t => 
      t.hash.toLowerCase() === hash.toLowerCase()
    );
    
    return transaction || null;
  }

  /**
   * Update a transaction's details
   */
  async updateTransaction(id: number, data: Partial<TransactionRecord>): Promise<boolean> {
    this.ensureConnected();
    
    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }
    
    this.transactions[index] = {
      ...this.transactions[index],
      ...data
    };
    
    return true;
  }

  /**
   * Create some test data for development and testing
   */
  private seedTestData(): void {
    // No initial test data needed, will be created via service methods
    console.log('MockDatabase: No test data seeded yet');
  }

  /**
   * Ensure the database is connected before operations
   */
  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }

  /**
   * Get a copy of all wallets (for testing)
   */
  getAllWallets(): WalletRecord[] {
    return [...this.wallets];
  }

  /**
   * Get a copy of all transactions (for testing)
   */
  getAllTransactions(): TransactionRecord[] {
    return [...this.transactions];
  }

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    this.wallets = [];
    this.transactions = [];
    this.walletIdCounter = 1;
    this.transactionIdCounter = 1;
    console.log('MockDatabase: All data cleared');
  }
} 