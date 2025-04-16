import dotenv from 'dotenv';
import { IWalletDatabase } from '../types/db';
import { MockDatabase } from './MockDatabase';
import { MySQLDatabase } from './MySQLDatabase';

dotenv.config();

/**
 * Factory class to create the appropriate database implementation
 * based on configuration (real MySQL or mock database)
 */
export class DatabaseFactory {
  /**
   * Create a database instance based on configuration
   * @returns Database implementation (real or mock)
   */
  static createDatabase(): IWalletDatabase {
    // Check if DB_MOCK is set to true in environment
    const useMock = process.env.DB_MOCK === 'true';
    
    if (useMock) {
      console.log('Using mock database implementation');
      return new MockDatabase();
    } else {
      console.log('Using real MySQL database implementation');
      return new MySQLDatabase();
    }
  }
} 