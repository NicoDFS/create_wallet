# Multi-Blockchain Wallet Generator

A TypeScript library for generating and managing secure cryptocurrency wallets across multiple blockchains with database integration and transaction tracking.

## Features

- **Multi-Chain Support**: Generate wallets for Ethereum (and EVM-compatible chains), Bitcoin, Solana, and Tron
- **Chain ID Support**: Track EVM network chain IDs for cross-chain transactions
- **Secure Encryption**: AES-256-CBC encryption for private keys
- **Database Integration**: Store wallet information and transactions in MySQL database
- **Transaction Tracking**: Record and track transactions with chain ID support for cross-chain swaps
- **Mock Database**: Development mode with in-memory mock database for testing

## Supported Blockchains

- **Ethereum** and EVM-compatible chains (Polygon, BSC, Arbitrum, Optimism, etc.)
- **Bitcoin** (mainnet and testnet)
- **Solana**
- **Tron**

## Supported EVM Networks

The library includes chain ID support for the following EVM networks:

- Ethereum Mainnet (1)
- Ethereum Goerli (5)
- Ethereum Sepolia (11155111)
- BSC Mainnet (56)
- BSC Testnet (97)
- Polygon Mainnet (137)
- Polygon Mumbai (80001)
- Arbitrum One (42161)
- Arbitrum Nova (42170)
- Optimism (10)
- Avalanche C-Chain (43114)
- Fantom (250)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root of the project:

```
# MySQL Database Configuration (Mock)
DB_HOST=localhost
DB_PORT=3306
DB_USER=wallet_user
DB_PASSWORD=dev_password
DB_NAME=wallet_db
DB_MOCK=true  # Set to true to use mock database, false for real MySQL

# Application
NODE_ENV=development
PORT=3000
API_SECRET=dev_secret_key
```

## Usage Examples

### Basic Wallet Generation

Generate wallets for all supported chains:

```typescript
import WalletManager from './src/index';

// Generate encrypted wallets
const password = 'MySecurePassword123!';
const wallets = WalletManager.generateWallets(password);

console.log('Ethereum Address:', wallets.ethereum.address);
console.log('Bitcoin Address:', wallets.bitcoin.address);
console.log('Solana Address:', wallets.solana.address);
console.log('Tron Address:', wallets.tron.address);

// Decrypt wallets for verification
WalletManager.decryptWallets(
  wallets.ethereum, 
  wallets.bitcoin, 
  wallets.solana, 
  wallets.tron,
  password
);
```

### Database Integration

Store and retrieve wallets with database integration:

```typescript
import { WalletService } from './src/services/WalletService';
import { CHAIN_IDS } from './src/types/db';

async function databaseExample() {
  // Create a wallet service instance
  const walletService = new WalletService();
  
  try {
    // Connect to database
    await walletService.init();
    
    // Generate wallets for a user
    const userId = 'user123';
    const password = 'SecurePassword123!';
    const wallets = await walletService.generateAndStoreWallets(userId, password);
    
    console.log('Ethereum Address:', wallets.ethereum?.address);
    
    // Generate an Ethereum wallet for Polygon
    const polygonWallet = await walletService.generateEthereumWallet(
      userId,
      password,
      CHAIN_IDS.POLYGON_MAINNET
    );
    
    console.log('Polygon Wallet Address:', polygonWallet.address);
    
    // Get all wallets for user
    const storedWallets = await walletService.getWallets(userId);
    console.log(`Found ${storedWallets.length} wallets`);
    
  } finally {
    // Disconnect from database
    await walletService.cleanup();
  }
}
```

### Transaction Recording

Record and retrieve transactions:

```typescript
import { WalletService } from './src/services/WalletService';
import { TransactionService } from './src/services/TransactionService';
import { CHAIN_IDS } from './src/types/db';

async function transactionExample() {
  const walletService = new WalletService();
  const transactionService = new TransactionService();
  
  try {
    await walletService.init();
    await transactionService.init();
    
    // Get user's Ethereum wallet
    const userId = 'user123';
    const wallets = await walletService.getWallets(userId);
    const ethWallet = wallets.find(w => w.walletType === 'ethereum');
    
    if (ethWallet) {
      // Record a transaction
      const transaction = await transactionService.recordTransaction(
        ethWallet.id,
        'send',
        ethWallet.address, // From address
        '0x1234567890123456789012345678901234567890', // To address
        '1.5', // Amount
        'ETH', // Currency
        '0.002', // Fee
        'completed', // Status
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', // Hash
        ethWallet.chainId // Chain ID
      );
      
      // Get transactions
      const transactions = await transactionService.getTransactionsByWallet(ethWallet.id);
      console.log(`Found ${transactions.length} transactions`);
    }
  } finally {
    await transactionService.cleanup();
    await walletService.cleanup();
  }
}
```

## Running Examples

```bash
# Basic wallet generation example
npm run example

# Database integration example
npm run example:db
```

## Running Tests

```bash
# Run all tests
npm test

# Run wallet service tests only
npm run test:wallet

# Run transaction service tests only
npm run test:transaction
```

## Mock vs. Real Database

Set `DB_MOCK=true` in your `.env` file to use the in-memory mock database for development and testing.
Set `DB_MOCK=false` to use a real MySQL database with the connection details specified in your `.env` file.

## License

ISC
