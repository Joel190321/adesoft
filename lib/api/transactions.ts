import { storage, generateId, formatDate } from '../storage';
import { Transaction } from '@/types/database';

export class TransactionsAPI {
  static async getAllTransactions(): Promise<Transaction[]> {
    try {
      const data = storage.get();
      return data.transactions.map(transaction => ({
        ...transaction,
        date: new Date(transaction.date),
        createdAt: new Date(transaction.createdAt),
        updatedAt: new Date(transaction.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }

  static async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const data = storage.get();
      const transaction = data.transactions.find(t => t.id === id);
      if (!transaction) return null;
      
      return {
        ...transaction,
        date: new Date(transaction.date),
        createdAt: new Date(transaction.createdAt),
        updatedAt: new Date(transaction.updatedAt),
      };
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  }

  static async getTransactionsByClient(clientId: string, type?: string): Promise<Transaction[]> {
    try {
      const data = storage.get();
      let filtered = data.transactions.filter(t => t.clientId === clientId);
      
      if (type) {
        filtered = filtered.filter(t => t.type === type);
      }
      
      return filtered.map(transaction => ({
        ...transaction,
        date: new Date(transaction.date),
        createdAt: new Date(transaction.createdAt),
        updatedAt: new Date(transaction.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting transactions by client:', error);
      throw error;
    }
  }

  static async getPendingTransactions(clientId: string): Promise<Transaction[]> {
    try {
      const data = storage.get();
      const filtered = data.transactions.filter(
        t => t.clientId === clientId && t.type === 'FA' && t.pendingValue > 0
      );
      
      return filtered.map(transaction => ({
        ...transaction,
        date: new Date(transaction.date),
        createdAt: new Date(transaction.createdAt),
        updatedAt: new Date(transaction.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting pending transactions:', error);
      throw error;
    }
  }

  static async createTransaction(transaction: Omit<Transaction, 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const data = storage.get();
      const newTransaction = {
        ...transaction,
        date: formatDate(transaction.date),
        createdAt: formatDate(new Date()),
        updatedAt: formatDate(new Date()),
      };
      
      data.transactions.push(newTransaction);
      storage.set(data);
      
      return {
        ...newTransaction,
        date: new Date(newTransaction.date),
        createdAt: new Date(newTransaction.createdAt),
        updatedAt: new Date(newTransaction.updatedAt),
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const data = storage.get();
      const index = data.transactions.findIndex(t => t.id === id);
      
      if (index === -1) {
        throw new Error('Transaction not found');
      }
      
      data.transactions[index] = {
        ...data.transactions[index],
        ...updates,
        updatedAt: formatDate(new Date()),
      };
      
      storage.set(data);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  static async deleteTransaction(id: string): Promise<void> {
    try {
      const data = storage.get();
      data.transactions = data.transactions.filter(t => t.id !== id);
      storage.set(data);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }
}