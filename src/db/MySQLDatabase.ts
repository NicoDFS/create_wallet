import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { 
  IWalletDatabase, 
  DatabaseConfig, 
  WalletRecord, 
  TransactionRecord, 
  CreateWalletData 
} from '../types/db';

dotenv.config();

/**
 * MySQL implementation of the wallet database
 * For production use with a real MySQL database
 */
export class MySQLDatabase implements IWalletDatabase {
  private connection: mysql.Connection | null = null;
  private config: DatabaseConfig;

  constructor(config?: DatabaseConfig) {
    // Use provided config or load from environment variables
    this.config = config || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wallet_db'
    };
  }

  /**
   * Connect to the MySQL database
   */
  async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    try {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database
      });
      
      console.log('Connected to MySQL database');
      
      // Ensure tables exist
      await this.ensureTablesExist();
    } catch (error) {
      console.error('Failed to connect to MySQL database:', error);
      throw new Error(`Database connection failed: ${(error as Error).message}`);
    }
  }

  /**
   * Disconnect from the MySQL database
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.log('Disconnected from MySQL database');
    }
  }

  /**
   * Create a new wallet record
   */
  async createWallet(userId: string, walletData: CreateWalletData): Promise<WalletRecord> {
    this.ensureConnected();
    
    try {
      const [result] = await this.connection!.execute(
        `INSERT INTO wallets (
          user_id, wallet_type, address, encrypted_private_key, 
          salt, iv, network, chain_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          walletData.walletType,
          walletData.address,
          walletData.encryptedPrivateKey,
          walletData.salt,
          walletData.iv,
          walletData.network || null,
          walletData.chainId || null
        ]
      );
      
      const insertId = (result as mysql.ResultSetHeader).insertId;
      
      const [rows] = await this.connection!.execute(
        'SELECT * FROM wallets WHERE id = ?',
        [insertId]
      );
      
      const walletRecord = this.mapRowToWalletRecord(rows as mysql.RowDataPacket[])[0];
      return walletRecord;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw new Error(`Failed to create wallet: ${(error as Error).message}`);
    }
  }

  /**
   * Get a wallet by user ID and address
   */
  async getWallet(userId: string, address: string): Promise<WalletRecord | null> {
    this.ensureConnected();
    
    try {
      const [rows] = await this.connection!.execute(
        'SELECT * FROM wallets WHERE user_id = ? AND address = ?',
        [userId, address]
      );
      
      const wallets = this.mapRowToWalletRecord(rows as mysql.RowDataPacket[]);
      return wallets.length > 0 ? wallets[0] : null;
    } catch (error) {
      console.error('Failed to get wallet:', error);
      throw new Error(`Failed to get wallet: ${(error as Error).message}`);
    }
  }

  /**
   * Get a wallet by its ID
   */
  async getWalletById(walletId: number): Promise<WalletRecord | null> {
    this.ensureConnected();
    
    try {
      const [rows] = await this.connection!.execute(
        'SELECT * FROM wallets WHERE id = ?',
        [walletId]
      );
      
      const wallets = this.mapRowToWalletRecord(rows as mysql.RowDataPacket[]);
      return wallets.length > 0 ? wallets[0] : null;
    } catch (error) {
      console.error('Failed to get wallet by ID:', error);
      throw new Error(`Failed to get wallet by ID: ${(error as Error).message}`);
    }
  }

  /**
   * Get all wallets for a user
   */
  async getWalletsByUser(userId: string): Promise<WalletRecord[]> {
    this.ensureConnected();
    
    try {
      const [rows] = await this.connection!.execute(
        'SELECT * FROM wallets WHERE user_id = ?',
        [userId]
      );
      
      return this.mapRowToWalletRecord(rows as mysql.RowDataPacket[]);
    } catch (error) {
      console.error('Failed to get wallets by user:', error);
      throw new Error(`Failed to get wallets by user: ${(error as Error).message}`);
    }
  }

  /**
   * Get wallets by chain ID for a specific user
   */
  async getWalletsByChainId(userId: string, chainId: number): Promise<WalletRecord[]> {
    this.ensureConnected();
    
    try {
      const [rows] = await this.connection!.execute(
        'SELECT * FROM wallets WHERE user_id = ? AND chain_id = ?',
        [userId, chainId]
      );
      
      return this.mapRowToWalletRecord(rows as mysql.RowDataPacket[]);
    } catch (error) {
      console.error('Failed to get wallets by chain ID:', error);
      throw new Error(`Failed to get wallets by chain ID: ${(error as Error).message}`);
    }
  }

  /**
   * Update wallet information
   */
  async updateWallet(walletId: number, data: Partial<WalletRecord>): Promise<boolean> {
    this.ensureConnected();
    
    try {
      // Build SET clause for the SQL query
      const setClauses: string[] = [];
      const values: any[] = [];
      
      if (data.address) {
        setClauses.push('address = ?');
        values.push(data.address);
      }
      
      if (data.encryptedPrivateKey) {
        setClauses.push('encrypted_private_key = ?');
        values.push(data.encryptedPrivateKey);
      }
      
      if (data.salt) {
        setClauses.push('salt = ?');
        values.push(data.salt);
      }
      
      if (data.iv) {
        setClauses.push('iv = ?');
        values.push(data.iv);
      }
      
      if (data.network !== undefined) {
        setClauses.push('network = ?');
        values.push(data.network);
      }
      
      if (data.chainId !== undefined) {
        setClauses.push('chain_id = ?');
        values.push(data.chainId);
      }
      
      setClauses.push('updated_at = NOW()');
      
      if (setClauses.length === 0) {
        return false;
      }
      
      values.push(walletId);
      
      const query = `UPDATE wallets SET ${setClauses.join(', ')} WHERE id = ?`;
      const [result] = await this.connection!.execute(query, values);
      
      return (result as mysql.ResultSetHeader).affectedRows > 0;
    } catch (error) {
      console.error('Failed to update wallet:', error);
      throw new Error(`Failed to update wallet: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a wallet
   */
  async deleteWallet(walletId: number): Promise<boolean> {
    this.ensureConnected();
    
    try {
      // First, delete related transactions
      await this.connection!.execute(
        'DELETE FROM transactions WHERE wallet_id = ?',
        [walletId]
      );
      
      // Then delete the wallet
      const [result] = await this.connection!.execute(
        'DELETE FROM wallets WHERE id = ?',
        [walletId]
      );
      
      return (result as mysql.ResultSetHeader).affectedRows > 0;
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      throw new Error(`Failed to delete wallet: ${(error as Error).message}`);
    }
  }

  /**
   * Record a new transaction
   */
  async recordTransaction(transaction: Omit<TransactionRecord, 'id' | 'timestamp'>): Promise<TransactionRecord> {
    this.ensureConnected();
    
    try {
      const [result] = await this.connection!.execute(
        `INSERT INTO transactions (
          wallet_id, transaction_type, from_address, to_address,
          amount, currency, fee, status, hash, chain_id,
          from_chain_id, to_chain_id, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          transaction.walletId,
          transaction.transactionType,
          transaction.fromAddress,
          transaction.toAddress,
          transaction.amount,
          transaction.currency,
          transaction.fee,
          transaction.status,
          transaction.hash,
          transaction.chainId || null,
          transaction.fromChainId || null,
          transaction.toChainId || null
        ]
      );
      
      const insertId = (result as mysql.ResultSetHeader).insertId;
      
      const [rows] = await this.connection!.execute(
        'SELECT * FROM transactions WHERE id = ?',
        [insertId]
      );
      
      const transactionRecord = this.mapRowToTransactionRecord(rows as mysql.RowDataPacket[])[0];
      return transactionRecord;
    } catch (error) {
      console.error('Failed to record transaction:', error);
      throw new Error(`Failed to record transaction: ${(error as Error).message}`);
    }
  }

  /**
   * Get all transactions for a wallet
   */
  async getTransactionsByWallet(walletId: number): Promise<TransactionRecord[]> {
    this.ensureConnected();
    
    try {
      const [rows] = await this.connection!.execute(
        'SELECT * FROM transactions WHERE wallet_id = ? ORDER BY timestamp DESC',
        [walletId]
      );
      
      return this.mapRowToTransactionRecord(rows as mysql.RowDataPacket[]);
    } catch (error) {
      console.error('Failed to get transactions by wallet:', error);
      throw new Error(`Failed to get transactions by wallet: ${(error as Error).message}`);
    }
  }

  /**
   * Get all transactions for a user across all their wallets
   */
  async getTransactionsByUser(userId: string): Promise<TransactionRecord[]> {
    this.ensureConnected();
    
    try {
      const [rows] = await this.connection!.execute(
        `SELECT t.* FROM transactions t
         JOIN wallets w ON t.wallet_id = w.id
         WHERE w.user_id = ?
         ORDER BY t.timestamp DESC`,
        [userId]
      );
      
      return this.mapRowToTransactionRecord(rows as mysql.RowDataPacket[]);
    } catch (error) {
      console.error('Failed to get transactions by user:', error);
      throw new Error(`Failed to get transactions by user: ${(error as Error).message}`);
    }
  }

  /**
   * Get a transaction by its hash
   */
  async getTransactionsByHash(hash: string): Promise<TransactionRecord | null> {
    this.ensureConnected();
    
    try {
      const [rows] = await this.connection!.execute(
        'SELECT * FROM transactions WHERE hash = ?',
        [hash]
      );
      
      const transactions = this.mapRowToTransactionRecord(rows as mysql.RowDataPacket[]);
      return transactions.length > 0 ? transactions[0] : null;
    } catch (error) {
      console.error('Failed to get transaction by hash:', error);
      throw new Error(`Failed to get transaction by hash: ${(error as Error).message}`);
    }
  }

  /**
   * Update a transaction's details
   */
  async updateTransaction(id: number, data: Partial<TransactionRecord>): Promise<boolean> {
    this.ensureConnected();
    
    try {
      // Build SET clause for the SQL query
      const setClauses: string[] = [];
      const values: any[] = [];
      
      if (data.status) {
        setClauses.push('status = ?');
        values.push(data.status);
      }
      
      if (data.hash) {
        setClauses.push('hash = ?');
        values.push(data.hash);
      }
      
      if (data.fee) {
        setClauses.push('fee = ?');
        values.push(data.fee);
      }
      
      if (setClauses.length === 0) {
        return false;
      }
      
      values.push(id);
      
      const query = `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ?`;
      const [result] = await this.connection!.execute(query, values);
      
      return (result as mysql.ResultSetHeader).affectedRows > 0;
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw new Error(`Failed to update transaction: ${(error as Error).message}`);
    }
  }

  /**
   * Ensure required database tables exist
   */
  private async ensureTablesExist(): Promise<void> {
    try {
      // Create wallets table
      await this.connection!.execute(`
        CREATE TABLE IF NOT EXISTS wallets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          wallet_type ENUM('ethereum', 'bitcoin', 'solana', 'tron') NOT NULL,
          address VARCHAR(255) NOT NULL,
          encrypted_private_key TEXT NOT NULL,
          salt VARCHAR(255) NOT NULL,
          iv VARCHAR(255) NOT NULL,
          network VARCHAR(50),
          chain_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_address (address),
          INDEX idx_chain_id (chain_id)
        )
      `);
      
      // Create transactions table
      await this.connection!.execute(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          wallet_id INT NOT NULL,
          transaction_type ENUM('send', 'receive', 'swap') NOT NULL,
          from_address VARCHAR(255) NOT NULL,
          to_address VARCHAR(255) NOT NULL,
          amount VARCHAR(255) NOT NULL,
          currency VARCHAR(50) NOT NULL,
          fee VARCHAR(255) NOT NULL,
          status ENUM('pending', 'completed', 'failed') NOT NULL,
          hash VARCHAR(255) NOT NULL,
          chain_id INT,
          from_chain_id INT,
          to_chain_id INT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_wallet_id (wallet_id),
          INDEX idx_hash (hash),
          INDEX idx_chain_id (chain_id),
          FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
        )
      `);
      
      console.log('Database tables created or already exist');
    } catch (error) {
      console.error('Failed to create database tables:', error);
      throw new Error(`Failed to create database tables: ${(error as Error).message}`);
    }
  }

  /**
   * Convert MySQL row data to WalletRecord
   */
  private mapRowToWalletRecord(rows: mysql.RowDataPacket[]): WalletRecord[] {
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      walletType: row.wallet_type,
      address: row.address,
      encryptedPrivateKey: row.encrypted_private_key,
      salt: row.salt,
      iv: row.iv,
      network: row.network,
      chainId: row.chain_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  /**
   * Convert MySQL row data to TransactionRecord
   */
  private mapRowToTransactionRecord(rows: mysql.RowDataPacket[]): TransactionRecord[] {
    return rows.map(row => ({
      id: row.id,
      walletId: row.wallet_id,
      transactionType: row.transaction_type,
      fromAddress: row.from_address,
      toAddress: row.to_address,
      amount: row.amount,
      currency: row.currency,
      fee: row.fee,
      status: row.status,
      hash: row.hash,
      chainId: row.chain_id,
      fromChainId: row.from_chain_id,
      toChainId: row.to_chain_id,
      timestamp: new Date(row.timestamp)
    }));
  }

  /**
   * Ensure the database is connected before operations
   */
  private ensureConnected(): void {
    if (!this.connection) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }
} 