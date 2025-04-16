# Crypto Wallet Generator

This project demonstrates how to create and manage Ethereum (EVM-compatible), Bitcoin, Solana, and Tron wallets with secure private key encryption. It's designed as an educational tool to understand the basics of cryptocurrency wallet generation and management.

## Features

- Generate Ethereum (EVM-compatible) wallets
- Generate Bitcoin wallets (supports both mainnet and testnet)
- Generate Solana wallets
- Generate Tron wallets
- Secure private key encryption using AES-256-CBC
- Password-based key derivation using PBKDF2
- Support for wallet decryption and recovery

## Technical Details

### Security Features

- Uses `crypto` module for cryptographic operations
- Implements PBKDF2 for key derivation with 100,000 iterations
- Employs AES-256-CBC for private key encryption
- Generates unique salt and IV for each wallet
- Stores encrypted private keys instead of plaintext

### Dependencies

- `ethers`: For Ethereum wallet operations
- `bitcoinjs-lib`: For Bitcoin wallet operations
- `ecpair`: For Bitcoin key pair management
- `tiny-secp256k1`: For Bitcoin cryptographic operations
- `@solana/web3.js`: For Solana wallet operations
- `bs58`: For Base58 encoding/decoding used by Solana
- `tronweb`: For Tron wallet operations

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Basic Usage

```typescript
import WalletManager from './src';

// Generate new wallets
const password = 'YourSecurePassword123!';
const wallets = WalletManager.generateWallets(password);

// The wallets object contains Ethereum, Bitcoin, Solana, and Tron wallets:
console.log('Ethereum Address:', wallets.ethereum.address);
console.log('Bitcoin Address:', wallets.bitcoin.address);
console.log('Solana Address:', wallets.solana.address);
console.log('Tron Address:', wallets.tron.address);

// Decrypt wallets
WalletManager.decryptWallets(
  wallets.ethereum, 
  wallets.bitcoin, 
  wallets.solana,
  wallets.tron,
  password
);
```

### Individual Wallet Generation

For Ethereum:
```typescript
import EthereumWalletGenerator from './src/walletGenerator';

const ethWallet = EthereumWalletGenerator.generateEncryptedWallet('password');
```

For Bitcoin:
```typescript
import BitcoinWalletGenerator from './src/bitcoinWalletGenerator';

// Generate mainnet wallet (default)
const btcWallet = BitcoinWalletGenerator.generateEncryptedWallet('password');

// Or generate testnet wallet
const testnetWallet = BitcoinWalletGenerator.generateEncryptedWallet('password', 'testnet');
```

For Solana:
```typescript
import SolanaWalletGenerator from './src/solanaWalletGenerator';

const solWallet = SolanaWalletGenerator.generateEncryptedWallet('password');
```

For Tron:
```typescript
import TronWalletGenerator from './src/tronWalletGenerator';

const tronWallet = TronWalletGenerator.generateEncryptedWallet('password');
```

## Security Best Practices

1. Always use strong passwords
2. Never store private keys in plaintext
3. Keep encrypted wallet data secure
4. Don't share password or private keys
5. Consider using hardware wallets for large amounts

## Educational Notes

### Understanding Wallet Generation

- **Ethereum Wallets**: Use secp256k1 elliptic curve cryptography to generate key pairs
- **Bitcoin Wallets**: Use the same curve but with different address formats and network parameters
- **Solana Wallets**: Use Ed25519 curve for key generation
- **Tron Wallets**: Use secp256k1 elliptic curve with a specific address format
- Each blockchain implements different address derivation schemes

### Private Key Encryption Process

1. Generate random salt and IV
2. Derive encryption key from password using PBKDF2
3. Encrypt private key using AES-256-CBC
4. Store encrypted key, salt, and IV

## Development

To run tests:
```bash
npm test
```

To build:
```bash
npm run build
```

## Warning

This is an educational project. While it implements proper cryptographic practices, it's recommended to use well-audited wallet solutions for handling real cryptocurrency assets.

## License

MIT
