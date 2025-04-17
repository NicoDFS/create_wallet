import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

/**
 * Interface for token swap rate data
 */
export interface SwapRate {
  estimatedAmount: string;
  rate: string;
  fee: string;
  networkFee: string; // Network fee for the transaction
  fromChainId?: number;
  toChainId?: number;
}

/**
 * Interface for token swap status
 */
export interface SwapStatus {
  status: 'waiting' | 'confirming' | 'exchanging' | 'sending' | 'finished' | 'failed' | 'refunded';
  payinHash?: string;
  payoutHash?: string;
  fromAmount?: string;
  toAmount?: string;
  expectedToAmount?: string;
  fromChainId?: number;
  toChainId?: number;
}

/**
 * Interface for swap transaction data
 */
export interface SwapTransaction {
  id: string;
  payinAddress: string;
  payoutAddress: string;
  fromCurrency: string;
  toCurrency: string;
  expectedAmountFrom: string;
  expectedAmountTo: string;
  refundAddress?: string;
  fromChainId?: number;
  toChainId?: number;
}

/**
 * Configuration options for the ChangeNow API
 */
export interface ChangeNowConfig {
  apiKey: string;
  apiUrl: string;
  useMock: boolean;
}

/**
 * ChangeNow API class for handling token swaps
 */
export class ChangeNowAPI {
  private apiKey: string;
  private apiUrl: string;
  private useMock: boolean;

  constructor(config?: Partial<ChangeNowConfig>) {
    this.apiKey = config?.apiKey || process.env.CHANGE_NOW_API_KEY || 'your_api_key_here';
    this.apiUrl = config?.apiUrl || process.env.CHANGE_NOW_API_URL || 'https://api.changenow.io/v2';
    this.useMock = config?.useMock !== undefined ? config.useMock : process.env.API_MOCK === 'true';
  }

  /**
   * Get estimated exchange rate for a token swap
   * @param fromCurrency Source currency ticker (e.g., 'ETH', 'BTC')
   * @param toCurrency Target currency ticker (e.g., 'BTC', 'TRX')
   * @param amount Amount to exchange in source currency
   * @param fromChainId Optional chain ID for EVM source network
   * @param toChainId Optional chain ID for EVM target network
   * @returns Promise with estimated swap rate data
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    amount: string,
    fromChainId?: number,
    toChainId?: number
  ): Promise<SwapRate> {
    if (this.useMock) {
      return this.getMockExchangeRate(fromCurrency, toCurrency, amount, fromChainId, toChainId);
    }

    try {
      const response = await axios.get(`${this.apiUrl}/exchange/estimated-amount`, {
        params: {
          fromCurrency,
          toCurrency,
          fromAmount: amount,
          fromNetwork: this.getNetworkName(fromCurrency, fromChainId),
          toNetwork: this.getNetworkName(toCurrency, toChainId),
          apiKey: this.apiKey
        }
      });

      return {
        estimatedAmount: response.data.toAmount,
        rate: response.data.rate,
        fee: response.data.fee || '0',
        networkFee: response.data.networkFee || '0',
        fromChainId,
        toChainId
      };
    } catch (error: any) {
      console.error('Error getting exchange rate:', error);
      throw new Error(`Failed to get exchange rate: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Create a new swap transaction
   * @param fromCurrency Source currency ticker
   * @param toCurrency Target currency ticker
   * @param amount Amount to exchange in source currency
   * @param toAddress Target wallet address to receive exchanged currency
   * @param refundAddress Refund address in case of failed transaction
   * @param fromChainId Optional chain ID for EVM source network
   * @param toChainId Optional chain ID for EVM target network
   * @returns Promise with swap transaction data
   */
  async createTransaction(
    fromCurrency: string,
    toCurrency: string,
    amount: string,
    toAddress: string,
    refundAddress: string,
    fromChainId?: number,
    toChainId?: number
  ): Promise<SwapTransaction> {
    if (this.useMock) {
      return this.getMockTransaction(
        fromCurrency, 
        toCurrency, 
        amount, 
        toAddress, 
        refundAddress, 
        fromChainId, 
        toChainId
      );
    }

    try {
      const response = await axios.post(`${this.apiUrl}/exchange`, {
        fromCurrency,
        toCurrency,
        fromAmount: amount,
        address: toAddress,
        refundAddress,
        fromNetwork: this.getNetworkName(fromCurrency, fromChainId),
        toNetwork: this.getNetworkName(toCurrency, toChainId),
        apiKey: this.apiKey
      });

      return {
        id: response.data.id,
        payinAddress: response.data.payinAddress,
        payoutAddress: toAddress,
        fromCurrency,
        toCurrency,
        expectedAmountFrom: amount,
        expectedAmountTo: response.data.expectedAmountTo,
        refundAddress,
        fromChainId,
        toChainId
      };
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      throw new Error(`Failed to create transaction: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get status of an existing swap transaction
   * @param transactionId ID of the swap transaction
   * @returns Promise with transaction status data
   */
  async getTransactionStatus(transactionId: string): Promise<SwapStatus> {
    if (this.useMock) {
      return this.getMockTransactionStatus(transactionId);
    }

    try {
      const response = await axios.get(`${this.apiUrl}/exchange/by-id`, {
        params: {
          id: transactionId,
          apiKey: this.apiKey
        }
      });

      return {
        status: response.data.status,
        payinHash: response.data.payinHash,
        payoutHash: response.data.payoutHash,
        fromAmount: response.data.fromAmount,
        toAmount: response.data.toAmount,
        expectedToAmount: response.data.expectedToAmount,
        fromChainId: response.data.fromChainId,
        toChainId: response.data.toChainId
      };
    } catch (error: any) {
      console.error('Error getting transaction status:', error);
      throw new Error(`Failed to get transaction status: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Helper method to convert chain ID to network name used by ChangeNow
   * @param currency Currency ticker
   * @param chainId Chain ID for EVM networks
   * @returns Network name for the ChangeNow API
   */
  private getNetworkName(currency: string, chainId?: number): string | undefined {
    if (!chainId) return undefined;
    
    // Handle EVM networks based on chain ID
    switch (chainId) {
      case 1: return 'eth'; // Ethereum Mainnet
      case 56: return 'bsc'; // Binance Smart Chain
      case 137: return 'polygon'; // Polygon
      case 43114: return 'avalanche'; // Avalanche
      case 10: return 'optimism'; // Optimism
      case 42161: return 'arbitrum'; // Arbitrum
      default: return undefined;
    }
  }

  /**
   * MOCK IMPLEMENTATION: Get estimated exchange rate
   */
  private getMockExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    amount: string,
    fromChainId?: number,
    toChainId?: number
  ): SwapRate {
    // Simple mock calculation for testing purposes
    let rate = '0.05';
    
    if (fromCurrency === 'BTC' && toCurrency === 'ETH') {
      rate = '15.5';
    } else if (fromCurrency === 'ETH' && toCurrency === 'BTC') {
      rate = '0.065';
    } else if (fromCurrency === 'ETH' && toCurrency === 'MATIC') {
      rate = '500';
    } else if (fromCurrency === 'USDT' && toCurrency === 'BTC') {
      rate = '0.000035';
    }
    
    const numAmount = parseFloat(amount);
    const estimatedAmount = (numAmount * parseFloat(rate)).toString();
    
    return {
      estimatedAmount,
      rate,
      fee: (numAmount * 0.01).toString(), // 1% fee
      networkFee: '0.0005',
      fromChainId,
      toChainId
    };
  }

  /**
   * MOCK IMPLEMENTATION: Create a mock transaction
   */
  private getMockTransaction(
    fromCurrency: string,
    toCurrency: string,
    amount: string,
    toAddress: string,
    refundAddress: string,
    fromChainId?: number,
    toChainId?: number
  ): SwapTransaction {
    const rateInfo = this.getMockExchangeRate(fromCurrency, toCurrency, amount, fromChainId, toChainId);
    
    return {
      id: `mock-tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      payinAddress: `mock-address-${fromCurrency.toLowerCase()}`,
      payoutAddress: toAddress,
      fromCurrency,
      toCurrency,
      expectedAmountFrom: amount,
      expectedAmountTo: rateInfo.estimatedAmount,
      refundAddress,
      fromChainId,
      toChainId
    };
  }

  /**
   * MOCK IMPLEMENTATION: Get mock transaction status
   */
  private getMockTransactionStatus(transactionId: string): SwapStatus {
    // Simulate different statuses based on transaction ID
    const statusOptions: SwapStatus['status'][] = [
      'waiting', 'confirming', 'exchanging', 'sending', 'finished', 'failed', 'refunded'
    ];
    
    // Use the last character of the transaction ID to determine status
    const lastChar = transactionId.slice(-1);
    const statusIndex = parseInt(lastChar, 36) % statusOptions.length;
    
    return {
      status: statusOptions[statusIndex],
      payinHash: `0x${transactionId.substring(0, 64)}`,
      payoutHash: statusOptions[statusIndex] === 'finished' ? `0x${transactionId.substring(0, 64)}` : undefined,
      fromAmount: '1.0',
      toAmount: '15.5',
      expectedToAmount: '15.7'
    };
  }
} 