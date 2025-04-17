# ChangeNOW API Integration

## Overview

The Multi-Blockchain Wallet Generator integrates with the [ChangeNOW](https://changenow.io) API to provide cross-chain token swap functionality. This allows users to exchange tokens between different blockchains (e.g., swapping ETH for BTC or MATIC for USDT).

## Features

- **Cross-chain swaps**: Exchange tokens between different blockchains
- **Rate estimation**: Get real-time exchange rates before swapping
- **Transaction tracking**: Monitor swap progress and status updates
- **Chain ID support**: Specify source and destination chains for EVM networks

## Integration Architecture

The system integrates with ChangeNOW through the following components:

1. `ChangeNowAPI` class: Handles direct API communication
2. `SwapService` class: Business logic layer for swap functionality
3. Database integration: Stores swap transactions and status updates

## Using the Swap Service

### Initialization

```typescript
import { SwapService } from './src/services/SwapService';

// Create an instance (defaults to using environment variables)
const swapService = new SwapService();

// For testing, use the mock API client
const testSwapService = new SwapService(true);

// Initialize (connects to database)
await swapService.init();

// When finished with operations
await swapService.cleanup();
```

### Getting Exchange Rates

Before creating a swap, you can get estimated exchange rates:

```typescript
import { CHAIN_IDS } from './src/types/db';

// Get the exchange rate for ETH to BTC
const rate = await swapService.getExchangeRate(
  'ETH',              // Source currency
  'BTC',              // Target currency
  '1.0',              // Amount to exchange
  CHAIN_IDS.ETHEREUM_MAINNET,  // Source chain ID (optional)
  undefined           // Target chain ID (optional)
);

console.log(`Estimated amount: ${rate.estimatedAmount} BTC`);
console.log(`Rate: ${rate.rate}`);
console.log(`Fee: ${rate.fee}`);
```

### Creating a Swap Transaction

```typescript
// Create a swap transaction
const swap = await swapService.createSwap(
  walletId,            // Source wallet ID
  'ETH',               // Source currency
  'BTC',               // Target currency
  '1.0',               // Amount in source currency
  'btc-destination-address',  // Destination address
  'eth-refund-address',       // Refund address (if swap fails)
  CHAIN_IDS.ETHEREUM_MAINNET, // Source chain ID (optional)
  undefined            // Target chain ID (optional)
);

console.log(`Created swap transaction with ID: ${swap.id}`);
console.log(`Status: ${swap.status}`);
```

### Checking Swap Status

```typescript
// Check status of a specific swap
const swapStatus = await swapService.getSwapStatus('swap-transaction-id');
console.log(`Swap status: ${swapStatus.status}`);

// Update status in the database
await swapService.updateSwapStatus(swapId, 'completed');

// Update all pending swaps
const updatedCount = await swapService.updatePendingSwaps();
console.log(`Updated ${updatedCount} pending swaps`);
```

### Retrieving Swap Transactions

```typescript
// Get all swaps for a wallet
const walletSwaps = await swapService.getSwapsByWallet(walletId);

// Get all swaps for a user across all their wallets
const userSwaps = await swapService.getSwapsByUser(userId);
```

## ChangeNOW API Configuration

Configure the ChangeNOW API in the `.env` file:

```
CHANGE_NOW_API_KEY=your_api_key
CHANGE_NOW_API_URL=https://api.changenow.io/v2
API_MOCK=false  # Set to 'true' for development mode
```

## Mock Mode

For development and testing, the system includes a full mock implementation of the ChangeNOW API client:

```typescript
// Use mock mode for testing
const swapService = new SwapService(true);
```

This will return realistic but fabricated data without making actual API calls.

## ChangeNOW API Rate Limits

Be aware of ChangeNOW API rate limits when implementing your integration:

- Standard API key: 10 requests per minute
- Premium API key: 60 requests per minute

Implement appropriate throttling and error handling to stay within these limits.

## ChangeNOW API Fee Structure

ChangeNOW charges a 0.4% fee for token swaps. This fee is automatically included in the exchange rates provided by the API.

## Error Handling

The API integration includes comprehensive error handling:

```typescript
try {
  const rate = await swapService.getExchangeRate('ETH', 'BTC', '1.0');
} catch (error) {
  console.error('Error getting exchange rate:', error.message);
  // Handle specific error cases based on the message
}
```

Common error scenarios to handle:

1. Network connectivity issues
2. Invalid API key
3. Unsupported currency pairs
4. Minimum/maximum amount constraints
5. API rate limiting

## Best Practices

1. **Always get current rates** before creating a swap
2. **Implement proper error handling** for all API calls
3. **Use the mock implementation** for development and testing
4. **Monitor swap status** periodically to update the user
5. **Verify destination addresses** carefully before executing swaps
6. **Store swap transaction IDs** for future reference and status checking 