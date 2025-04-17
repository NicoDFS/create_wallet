import { EncryptedWallet } from '../walletGenerator';
import { EncryptedBitcoinWallet } from '../bitcoinWalletGenerator';
import { EncryptedSolanaWallet } from '../solanaWalletGenerator';
import { EncryptedTronWallet } from '../tronWalletGenerator';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface WalletRecord {
  id: number;
  userId: string;
  walletType: 'ethereum' | 'bitcoin' | 'solana' | 'tron';
  address: string;
  encryptedPrivateKey: string;
  salt: string;
  iv: string;
  network?: string;  // For Bitcoin
  chainId?: number;  // For EVM networks
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionRecord {
  id: number;
  walletId: number;
  transactionType: 'send' | 'receive' | 'swap';
  fromAddress: string;
  toAddress: string;
  amount: string;
  currency: string;
  fee: string;
  status: 'pending' | 'completed' | 'failed';
  hash: string;
  chainId?: number;  // For EVM networks
  fromChainId?: number; // For cross-chain transactions
  toChainId?: number;   // For cross-chain transactions
  timestamp: Date;
}

// Types for wallet database operations
export interface IWalletDatabase {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // Wallet operations
  createWallet(userId: string, walletData: CreateWalletData): Promise<WalletRecord>;
  getWallet(userId: string, address: string): Promise<WalletRecord | null>;
  getWalletById(walletId: number): Promise<WalletRecord | null>;
  getWalletsByUser(userId: string): Promise<WalletRecord[]>;
  getWalletsByChainId(userId: string, chainId: number): Promise<WalletRecord[]>;
  updateWallet(walletId: number, data: Partial<WalletRecord>): Promise<boolean>;
  deleteWallet(walletId: number): Promise<boolean>;
  
  // Transaction operations
  recordTransaction(transaction: Omit<TransactionRecord, 'id' | 'timestamp'>): Promise<TransactionRecord>;
  getTransactionsByWallet(walletId: number): Promise<TransactionRecord[]>;
  getTransactionsByUser(userId: string): Promise<TransactionRecord[]>;
  getTransactionsByHash(hash: string): Promise<TransactionRecord | null>;
  getTransactionsByStatus(status: TransactionRecord['status']): Promise<TransactionRecord[]>;
  updateTransaction(id: number, data: Partial<TransactionRecord>): Promise<boolean>;
}

// Type for creating a new wallet record
export interface CreateWalletData {
  walletType: 'ethereum' | 'bitcoin' | 'solana' | 'tron';
  address: string;
  encryptedPrivateKey: string;
  salt: string;
  iv: string;
  network?: string;
  chainId?: number;
}

// Helper types for passing around wallet data
export interface DatabaseWalletData {
  ethereum?: EncryptedWallet & { chainId?: number };
  bitcoin?: EncryptedBitcoinWallet;
  solana?: EncryptedSolanaWallet;
  tron?: EncryptedTronWallet;
}

// Chain ID reference mapping
export const CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_GOERLI: 5,
  ETHEREUM_SEPOLIA: 11155111,
  BSC_MAINNET: 56,
  BSC_TESTNET: 97,
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001,
  ARBITRUM_ONE: 42161,
  ARBITRUM_NOVA: 42170,
  OPTIMISM: 10,
  AVALANCHE_C: 43114,
  FANTOM: 250
}; 