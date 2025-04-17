# Wallet Generation

This document provides details on the wallet generation functionality of the Multi-Blockchain Wallet Generator.

## Supported Blockchains

The system currently supports the following blockchains:

- **Ethereum** (and all EVM-compatible networks)
- **Bitcoin**
- **Solana**
- **Tron**

## Wallet Generation Process

All wallets are generated securely with cryptographically strong randomness. Private keys are encrypted with AES-256 using a password-derived key and stored securely in the database.

### Security Features

- Password-based encryption for all private keys
- Unique salt and initialization vector (IV) for each wallet
- No storage of plaintext private keys
- Optional hardware wallet support (coming soon)

## Wallet Service API

The `WalletService` class provides methods for wallet generation and management:

### Initialization

```typescript
import { WalletService } from './src/services/WalletService';

// Create an instance (uses mock database by default in development)
const walletService = new WalletService();

// Initialize (connects to database)
await walletService.init();

// When finished with operations
await walletService.cleanup();
```

### Generating Wallets

Generate a complete set of wallets (Ethereum, Bitcoin, Solana, Tron) for a user:

```typescript
// Generate and store a complete set of wallets
const userId = 'user123';
const password = 'securePassw0rd!';

const wallets = await walletService.generateAndStoreWallets(userId, password);

console.log(wallets.ethereum.address); // 0x...
console.log(wallets.bitcoin.address);  // 1...
console.log(wallets.solana.address);   // ...
console.log(wallets.tron.address);     // T...
```

### Generate a Specific Wallet Type

Generate just a single wallet type:

```typescript
// Generate an Ethereum wallet
const ethWallet = await walletService.generateEthereumWallet(userId, password);

// Generate a Bitcoin wallet
const btcWallet = await walletService.generateBitcoinWallet(userId, password);

// Generate a Solana wallet
const solWallet = await walletService.generateSolanaWallet(userId, password);

// Generate a Tron wallet
const tronWallet = await walletService.generateTronWallet(userId, password);
```

### Wallet for Specific EVM Chain

Generate an Ethereum wallet for a specific EVM-compatible chain:

```typescript
import { CHAIN_IDS } from './src/types/db';

// Generate a wallet for Polygon (MATIC)
const polygonWallet = await walletService.generateEthereumWallet(
  userId,
  password,
  CHAIN_IDS.POLYGON_MAINNET // 137
);

// Generate a wallet for Binance Smart Chain (BSC)
const bscWallet = await walletService.generateEthereumWallet(
  userId,
  password,
  CHAIN_IDS.BSC_MAINNET // 56
);
```

### Retrieving Wallets

Retrieve existing wallets:

```typescript
// Get all wallets for a user
const wallets = await walletService.getWallets(userId);

// Get wallets for a specific chain ID
const polygonWallets = await walletService.getWalletsByChainId(
  userId,
  CHAIN_IDS.POLYGON_MAINNET
);

// Get a wallet by address
const wallet = await walletService.getWallet(userId, walletAddress);
```

### Decrypting Wallet Private Keys

Decrypt a wallet's private key using the password:

```typescript
const walletId = 123;
const decryptedWallet = await walletService.decryptWallet(walletId, password);

// The private key is now available
console.log(decryptedWallet.privateKey);

// IMPORTANT: Handle private keys securely and never store them unencrypted
```

## Best Practices

1. **Always use strong passwords** for encrypting wallets
2. **Never store unencrypted private keys** in your application code, logs, or databases
3. **Use chain IDs** to differentiate wallets across EVM networks
4. **Implement proper error handling** for wallet operations
5. **Validate addresses** before performing transactions 