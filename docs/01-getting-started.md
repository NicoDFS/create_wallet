# Getting Started with Multi-Blockchain Wallet Generator

## Overview

The Multi-Blockchain Wallet Generator is a TypeScript library that provides functionality for generating, encrypting, and managing wallets across multiple blockchain networks. It supports various operations including wallet creation, transaction management, and cross-chain token swaps.

## Key Features

- **Multi-blockchain support**: Create and manage wallets for Ethereum, Bitcoin, Solana, and Tron blockchains
- **EVM chain support**: Generate Ethereum-compatible wallets for various EVM networks using chain IDs
- **Secure key management**: Strong encryption for private keys with customizable password protection
- **Transaction handling**: Record and manage blockchain transactions with full history
- **Cross-chain swaps**: Integrated ChangeNOW API for token exchange between different blockchains
- **Mock implementations**: Built-in mock database and API clients for testing and development

## System Requirements

- Node.js 14 or higher
- TypeScript 4.5 or higher
- MySQL database (for production)

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/create-wallet.git
cd create-wallet

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration settings
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=wallet_db

# ChangeNOW API Configuration
CHANGE_NOW_API_KEY=your_api_key
CHANGE_NOW_API_URL=https://api.changenow.io/v2

# Mock Mode (set to 'true' for development)
API_MOCK=true
```

## Basic Usage

```typescript
import { WalletService } from './src/services/WalletService';
import { TransactionService } from './src/services/TransactionService';
import { SwapService } from './src/services/SwapService';

// Initialize services
const walletService = new WalletService();
const transactionService = new TransactionService();
const swapService = new SwapService();

// Connect to database
await walletService.init();
await transactionService.init();
await swapService.init();

// Generate wallets
const userId = 'user123';
const password = 'securePassw0rd!';
const wallets = await walletService.generateAndStoreWallets(userId, password);

// Clean up (disconnect from database)
await walletService.cleanup();
await transactionService.cleanup();
await swapService.cleanup();
```

## Next Steps

- See [Wallet Generation](02-wallet-generation.md) for more details on creating and managing wallets
- See [Chain ID Support](03-chain-id-support.md) for information about EVM network support
- See [Database Schema](04-database-schema.md) for details on the database structure
- See [API Integration](05-api-integration.md) for ChangeNOW API integration documentation
- See [Code Examples](06-examples.md) for common usage examples
- See [Security Considerations](07-security.md) for security best practices
- See [Troubleshooting](08-troubleshooting.md) for common issues and solutions
- See [Fee Collection](09-fee-collection.md) for strategies to implement fee collection 