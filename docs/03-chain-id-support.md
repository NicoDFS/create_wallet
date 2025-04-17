# Chain ID Support

## Overview

Chain IDs are unique identifiers for different Ethereum-compatible networks. They are essential when working with multiple EVM (Ethereum Virtual Machine) blockchains to ensure transactions are signed correctly for the intended network, preventing replay attacks across chains.

Our wallet system supports multiple EVM chains through their respective chain IDs. This document explains how to work with different chains and provides a reference table of supported networks.

## Importance of Chain IDs

Chain IDs serve several critical purposes:

1. **Transaction Signing**: Each transaction must be signed with the correct chain ID to be valid on the intended network
2. **Network Identification**: Wallets and applications use chain IDs to identify which network they're connected to
3. **Replay Attack Prevention**: Chain IDs prevent signed transactions from being valid on multiple networks

## Using Chain IDs in the Wallet System

Chain IDs are used in several places throughout the system:

### Wallet Generation

```typescript
import { WalletService } from './src/services/WalletService';
import { CHAIN_IDS } from './src/types/db';

const walletService = new WalletService();
await walletService.init();

// Generate an Ethereum wallet for Ethereum Mainnet (chain ID 1)
const ethWallet = await walletService.generateEthereumWallet(
  'user123',
  'password',
  CHAIN_IDS.ETHEREUM_MAINNET
);

// Generate an Ethereum wallet for Polygon (chain ID 137)
const polygonWallet = await walletService.generateEthereumWallet(
  'user123',
  'password',
  CHAIN_IDS.POLYGON_MAINNET
);
```

### Wallet Retrieval by Chain

```typescript
// Get all Ethereum wallets on Avalanche network for a user
const avalancheWallets = await walletService.getWalletsByChainId(
  'user123',
  CHAIN_IDS.AVALANCHE_MAINNET
);
```

### Transaction Processing with Chain IDs

```typescript
import { TransactionService } from './src/services/TransactionService';
import { CHAIN_IDS } from './src/types/db';

const transactionService = new TransactionService();
await transactionService.init();

// Record a transaction on the Binance Smart Chain
await transactionService.recordTransaction({
  walletId: 123,
  transactionType: 'send',
  fromAddress: '0x...',
  toAddress: '0x...',
  amount: '0.1',
  currency: 'BNB',
  fee: '0.0005',
  hash: '0x...',
  chainId: CHAIN_IDS.BSC_MAINNET
});
```

### Cross-Chain Swaps with Source and Destination Chain IDs

```typescript
import { SwapService } from './src/services/SwapService';
import { CHAIN_IDS } from './src/types/db';

const swapService = new SwapService();
await swapService.init();

// Swap tokens from Ethereum to Polygon
const swap = await swapService.createSwap(
  walletId,
  'ETH',
  'MATIC',
  '1.0',
  'destination-address',
  'refund-address',
  CHAIN_IDS.ETHEREUM_MAINNET,  // Source chain
  CHAIN_IDS.POLYGON_MAINNET    // Destination chain
);
```

## Supported Chain IDs Reference Table

The following chain IDs are defined in the system:

| Network | Chain ID | Constant |
|---------|----------|----------|
| Ethereum Mainnet | 1 | `ETHEREUM_MAINNET` |
| Ethereum Goerli Testnet | 5 | `ETHEREUM_GOERLI` |
| Ethereum Sepolia Testnet | 11155111 | `ETHEREUM_SEPOLIA` |
| Optimism | 10 | `OPTIMISM_MAINNET` |
| Binance Smart Chain | 56 | `BSC_MAINNET` |
| Polygon | 137 | `POLYGON_MAINNET` |
| Polygon Mumbai Testnet | 80001 | `POLYGON_MUMBAI` |
| Avalanche C-Chain | 43114 | `AVALANCHE_MAINNET` |
| Avalanche Fuji Testnet | 43113 | `AVALANCHE_FUJI` |
| Arbitrum One | 42161 | `ARBITRUM_MAINNET` |
| Fantom Opera | 250 | `FANTOM_MAINNET` |

## Adding Support for Additional Chain IDs

To add support for a new EVM-compatible chain:

1. Add the new chain ID to the `CHAIN_IDS` constant in `src/types/db.ts`
2. Update the `getNetworkName` method in the `ChangeNowAPI` class if you need to support swaps to/from the new network
3. Update any network-specific configurations in your application

Example of adding a new chain ID:

```typescript
// In src/types/db.ts
export const CHAIN_IDS = {
  // Existing chain IDs...
  
  // Add new chain ID
  CRONOS_MAINNET: 25
};
```

## Best Practices

1. **Always specify the chain ID** when generating Ethereum wallets
2. **Include chain IDs in transactions** for proper record-keeping
3. **Validate chain IDs** before processing transactions
4. **Use the predefined constants** rather than hardcoding ID numbers
5. **Use the correct coin symbol** for each network (e.g., ETH for Ethereum, MATIC for Polygon) 