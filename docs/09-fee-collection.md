# Fee Collection Strategies

## Overview

The Multi-Blockchain Wallet Generator provides a foundation for token swap operations via the ChangeNOW API, which has its own fee structure (0.4%). However, when integrating this library into a commercial platform, you'll likely want to implement your own fee collection on top of the base exchange fees.

This document outlines various strategies for implementing platform fees for wallet operations and token swaps.

## ChangeNOW Base Fee Structure

By default, ChangeNOW charges a 0.4% fee on all token swaps. This fee is automatically included in the exchange rates returned by their API. The current implementation passes this fee directly to the user without adding any additional platform fees.

## Platform Fee Implementation Strategies

### 1. Markup on Exchange Rates

The simplest approach to implementing platform fees is to apply a percentage markup on the exchange rates:

```typescript
import { SwapService } from './src/services/SwapService';

class PlatformSwapService {
  private swapService: SwapService;
  private feePercentage: number; // Platform fee percentage (e.g., 0.5%)

  constructor(feePercentage = 0.5) {
    this.swapService = new SwapService();
    this.feePercentage = feePercentage;
  }

  async init(): Promise<void> {
    await this.swapService.init();
  }

  async cleanup(): Promise<void> {
    await this.swapService.cleanup();
  }

  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    amount: string,
    fromChainId?: number,
    toChainId?: number
  ) {
    // Get base rate from ChangeNOW
    const baseRate = await this.swapService.getExchangeRate(
      fromCurrency, toCurrency, amount, fromChainId, toChainId
    );
    
    // Apply platform fee
    const platformFee = parseFloat(baseRate.estimatedAmount) * this.feePercentage;
    const adjustedAmount = (parseFloat(baseRate.estimatedAmount) - platformFee).toString();
    
    return {
      ...baseRate,
      estimatedAmount: adjustedAmount,
      platformFee: platformFee.toString(),
      totalFee: (parseFloat(baseRate.fee) + platformFee).toString()
    };
  }

  async createSwap(
    walletId: number,
    fromCurrency: string,
    toCurrency: string,
    fromAmount: string,
    toAddress: string,
    refundAddress: string,
    fromChainId?: number,
    toChainId?: number
  ) {
    // Get the exchange rate with fees applied
    const rateWithFees = await this.getExchangeRate(
      fromCurrency, toCurrency, fromAmount, fromChainId, toChainId
    );
    
    // Create the swap with the base service
    return this.swapService.createSwap(
      walletId,
      fromCurrency,
      toCurrency,
      fromAmount,
      toAddress,
      refundAddress,
      fromChainId,
      toChainId
    );
    
    // Note: In this basic implementation, the fee is shown to the user but not collected
    // A real implementation would also handle fee collection
  }
}
```

### 2. Fixed Fee per Transaction

You may prefer to charge a fixed fee per transaction instead of or in addition to a percentage:

```typescript
class FixedFeeSwapService {
  private swapService: SwapService;
  private fixedFee: { [currency: string]: string };  // Fixed fee amount by currency
  
  constructor(fixedFee = { 'ETH': '0.005', 'BTC': '0.0001', 'USDT': '2.0' }) {
    this.swapService = new SwapService();
    this.fixedFee = fixedFee;
  }
  
  // Implementation of methods...
}
```

### 3. Schema Extension for Fee Tracking

Extend the database schema to track platform fees:

```sql
-- Add columns to the transactions table
ALTER TABLE transactions
ADD COLUMN base_fee VARCHAR(255),
ADD COLUMN platform_fee VARCHAR(255),
ADD COLUMN platform_fee_currency VARCHAR(50);
```

Then update the transaction recording logic:

```typescript
async recordSwapWithFees(
  transaction: SwapTransaction,
  baseFee: string,
  platformFee: string
) {
  // Record transaction with fee details
  return this.db.recordTransaction({
    ...transaction,
    fee: baseFee,
    platformFee: platformFee,
    platformFeeCurrency: transaction.currency
  });
}
```

### 4. Fee Collection Account

Collect fees in a dedicated platform account:

```typescript
class FeeCollectionSwapService {
  private swapService: SwapService;
  private feeWalletAddress: string;
  private feePercentage: number;
  
  constructor(feeWalletAddress: string, feePercentage = 0.5) {
    this.swapService = new SwapService();
    this.feeWalletAddress = feeWalletAddress;
    this.feePercentage = feePercentage;
  }
  
  // Implementation would include logic to:
  // 1. Calculate fees
  // 2. Subtract fees from user's amount
  // 3. Create a separate transaction to transfer fees to the fee wallet
}
```

### 5. Fee Tiers by User Level

Implement different fee tiers based on user levels or volume:

```typescript
class TieredFeeSwapService {
  private swapService: SwapService;
  private feeStructure: {
    [userTier: string]: number  // Fee percentage by user tier
  };
  
  constructor() {
    this.swapService = new SwapService();
    this.feeStructure = {
      'basic': 1.0,     // 1% fee for basic users
      'premium': 0.5,   // 0.5% fee for premium users
      'enterprise': 0.2 // 0.2% fee for enterprise users
    };
  }
  
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    amount: string,
    userTier: string,
    fromChainId?: number,
    toChainId?: number
  ) {
    // Apply fee based on user tier
    const feePercentage = this.feeStructure[userTier] || this.feeStructure['basic'];
    
    // Rest of implementation...
  }
}
```

## Implementation Considerations

1. **Transparency**: Clearly communicate the fee structure to users before they confirm transactions
2. **Regulatory Compliance**: Ensure your fee structure complies with relevant regulations in your jurisdiction
3. **Accounting**: Implement proper accounting for collected fees
4. **Fee Wallet Security**: If using a fee collection wallet, ensure its private keys are highly secured
5. **Competitive Analysis**: Research competitors' fee structures to ensure yours remains competitive

## Example: Complete Fee Implementation

Here's a more complete example combining several strategies:

```typescript
import { SwapService } from './src/services/SwapService';
import { TransactionService } from './src/services/TransactionService';
import { CHAIN_IDS } from './src/types/db';

class EnhancedSwapService {
  private swapService: SwapService;
  private transactionService: TransactionService;
  private feePercentage: number;
  private feeCollectionAddress: string;
  
  constructor(
    feePercentage = 0.5,
    feeCollectionAddress = 'your-platform-fee-wallet-address'
  ) {
    this.swapService = new SwapService();
    this.transactionService = new TransactionService();
    this.feePercentage = feePercentage;
    this.feeCollectionAddress = feeCollectionAddress;
  }
  
  async init(): Promise<void> {
    await this.swapService.init();
    await this.transactionService.init();
  }
  
  async cleanup(): Promise<void> {
    await this.swapService.cleanup();
    await this.transactionService.cleanup();
  }
  
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    amount: string,
    fromChainId?: number,
    toChainId?: number
  ) {
    const baseRate = await this.swapService.getExchangeRate(
      fromCurrency, toCurrency, amount, fromChainId, toChainId
    );
    
    // Calculate platform fee (in target currency)
    const platformFeeAmount = parseFloat(baseRate.estimatedAmount) * (this.feePercentage / 100);
    
    // Adjust estimated amount
    const adjustedAmount = parseFloat(baseRate.estimatedAmount) - platformFeeAmount;
    
    return {
      ...baseRate,
      rawEstimatedAmount: baseRate.estimatedAmount,
      estimatedAmount: adjustedAmount.toString(),
      platformFee: platformFeeAmount.toString(),
      totalFeePercentage: (0.4 + this.feePercentage).toString(), // ChangeNOW + platform fee
    };
  }
  
  async createSwap(
    walletId: number,
    fromCurrency: string,
    toCurrency: string,
    fromAmount: string,
    toAddress: string,
    refundAddress: string,
    fromChainId?: number,
    toChainId?: number
  ) {
    // Get exchange rate with platform fee calculated
    const rateWithFees = await this.getExchangeRate(
      fromCurrency, toCurrency, fromAmount, fromChainId, toChainId
    );
    
    // Create the swap with original parameters
    const swap = await this.swapService.createSwap(
      walletId,
      fromCurrency,
      toCurrency,
      fromAmount,
      toAddress, // User's destination address
      refundAddress,
      fromChainId,
      toChainId
    );
    
    // Record the platform fee - in a real implementation, this would also
    // handle the actual collection of the fee
    await this.transactionService.recordTransaction({
      walletId,
      transactionType: 'fee',
      fromAddress: toAddress,
      toAddress: this.feeCollectionAddress,
      amount: rateWithFees.platformFee,
      currency: toCurrency,
      fee: '0',
      status: 'pending',
      hash: `fee-${swap.hash}`,
      chainId: toChainId,
      fromChainId,
      toChainId
    });
    
    return {
      ...swap,
      platformFee: rateWithFees.platformFee,
      estimatedAmountAfterFees: rateWithFees.estimatedAmount
    };
  }
}
```

## Conclusion

Implementing a fee collection strategy is essential for commercial platforms leveraging this wallet generator. The examples provided here demonstrate several approaches, but you should adapt them to your specific business requirements, user experience goals, and regulatory environment.

Remember that high fees can discourage users, while competitive fees that provide value-added services can enhance your platform's appeal. Always be transparent about your fee structure and provide clear documentation for your users. 