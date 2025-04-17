# Database Schema

This document describes the database schema used by the Multi-Blockchain Wallet Generator.

## Overview

The system uses a relational database with two primary tables:
1. `wallets`: Stores wallet information including encrypted private keys
2. `transactions`: Records transaction history for all wallets

Both MySQL and Mock database implementations are available, with identical schema and interface.

## Database Interface

All database operations are performed through the `IWalletDatabase` interface, which provides a consistent API regardless of the underlying implementation.

```typescript
import { DatabaseFactory } from '../db/DatabaseFactory';
import { IWalletDatabase } from '../types/db';

// Get the appropriate database implementation
const db: IWalletDatabase = DatabaseFactory.createDatabase();

// Connect to the database
await db.connect();

// Perform database operations...

// Disconnect when done
await db.disconnect();
```

## Table Definitions

### Wallets Table

The `wallets` table stores information about user wallets across different blockchains.

#### Schema

```sql
CREATE TABLE wallets (
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
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT | Auto-incremented primary key |
| `user_id` | VARCHAR(255) | User identifier for wallet ownership |
| `wallet_type` | ENUM | Type of blockchain ('ethereum', 'bitcoin', 'solana', 'tron') |
| `address` | VARCHAR(255) | Public address of the wallet |
| `encrypted_private_key` | TEXT | AES-256 encrypted private key |
| `salt` | VARCHAR(255) | Unique salt for key derivation |
| `iv` | VARCHAR(255) | Initialization vector for encryption |
| `network` | VARCHAR(50) | Network name for Bitcoin (e.g., 'mainnet', 'testnet') |
| `chain_id` | INT | Chain ID for EVM networks (e.g., 1 for Ethereum mainnet) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Transactions Table

The `transactions` table records all blockchain transactions across wallets.

#### Schema

```sql
CREATE TABLE transactions (
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
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT | Auto-incremented primary key |
| `wallet_id` | INT | Reference to wallet ID (foreign key) |
| `transaction_type` | ENUM | Type of transaction ('send', 'receive', 'swap') |
| `from_address` | VARCHAR(255) | Source address |
| `to_address` | VARCHAR(255) | Destination address |
| `amount` | VARCHAR(255) | Transaction amount |
| `currency` | VARCHAR(50) | Currency symbol (e.g., 'ETH', 'BTC') |
| `fee` | VARCHAR(255) | Transaction fee |
| `status` | ENUM | Transaction status ('pending', 'completed', 'failed') |
| `hash` | VARCHAR(255) | Transaction hash/ID |
| `chain_id` | INT | Chain ID for the transaction (for EVM networks) |
| `from_chain_id` | INT | Source chain ID (for cross-chain swaps) |
| `to_chain_id` | INT | Destination chain ID (for cross-chain swaps) |
| `timestamp` | TIMESTAMP | Transaction timestamp |

## Database Operations

### Wallet Operations

```typescript
// Create a new wallet
const wallet = await db.createWallet(userId, {
  walletType: 'ethereum',
  address: '0x...',
  encryptedPrivateKey: '...',
  salt: '...',
  iv: '...',
  chainId: 1
});

// Get a wallet by ID
const wallet = await db.getWalletById(walletId);

// Get a wallet by user ID and address
const wallet = await db.getWallet(userId, address);

// Get all wallets for a user
const wallets = await db.getWalletsByUser(userId);

// Get wallets for a specific chain ID
const wallets = await db.getWalletsByChainId(userId, 137);

// Update a wallet
const updated = await db.updateWallet(walletId, {
  chainId: 1
});

// Delete a wallet
const deleted = await db.deleteWallet(walletId);
```

### Transaction Operations

```typescript
// Record a new transaction
const transaction = await db.recordTransaction({
  walletId: 123,
  transactionType: 'send',
  fromAddress: '0x...',
  toAddress: '0x...',
  amount: '0.1',
  currency: 'ETH',
  fee: '0.001',
  status: 'pending',
  hash: '0x...',
  chainId: 1
});

// Get transactions for a wallet
const transactions = await db.getTransactionsByWallet(walletId);

// Get transactions for a user
const transactions = await db.getTransactionsByUser(userId);

// Get a transaction by hash
const transaction = await db.getTransactionsByHash(hash);

// Get transactions by status
const pendingTransactions = await db.getTransactionsByStatus('pending');

// Update a transaction
const updated = await db.updateTransaction(transactionId, {
  status: 'completed'
});
```

## Database Configuration

### MySQL Configuration

Configure the MySQL database connection in the `.env` file:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=wallet_db
```

### Mock Database

For development and testing, you can use the mock database implementation:

```typescript
import { MockDatabase } from '../db/MockDatabase';

const db = new MockDatabase();
await db.connect();

// Use as you would the real database...

await db.disconnect();
```

## Best Practices

1. **Always use the interface methods** rather than direct database queries
2. **Properly handle database errors** in your application code
3. **Use transactions** for operations that involve multiple updates
4. **Consider adding indices** for fields used frequently in WHERE clauses
5. **Regularly back up** the database in production environments 