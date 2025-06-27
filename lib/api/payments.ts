import { storage, generateId, formatDate } from '../storage';
import { PaymentReference } from '@/types/database';

export class PaymentsAPI {
  static async getAllPayments(): Promise<PaymentReference[]> {
    try {
      const data = storage.get();
      return data.payments.map(payment => ({
        ...payment,
        createdAt: new Date(payment.createdAt),
        updatedAt: new Date(payment.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting payments:', error);
      throw error;
    }
  }

  static async getPaymentsByClient(clientId: string): Promise<PaymentReference[]> {
    try {
      const data = storage.get();
      const filtered = data.payments.filter(p => p.clientId === clientId);
      
      return filtered.map(payment => ({
        ...payment,
        createdAt: new Date(payment.createdAt),
        updatedAt: new Date(payment.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting payments by client:', error);
      throw error;
    }
  }

  static async getPaymentsByInvoice(controlFa: string): Promise<PaymentReference[]> {
    try {
      const data = storage.get();
      const filtered = data.payments.filter(p => p.controlFa === controlFa);
      
      return filtered.map(payment => ({
        ...payment,
        createdAt: new Date(payment.createdAt),
        updatedAt: new Date(payment.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting payments by invoice:', error);
      throw error;
    }
  }

  static async createPayment(payment: Omit<PaymentReference, 'createdAt' | 'updatedAt'>): Promise<PaymentReference> {
    try {
      const data = storage.get();
      const newPayment = {
        ...payment,
        createdAt: formatDate(new Date()),
        updatedAt: formatDate(new Date()),
      };
      
      data.payments.push(newPayment);
      storage.set(data);
      
      return {
        ...newPayment,
        createdAt: new Date(newPayment.createdAt),
        updatedAt: new Date(newPayment.updatedAt),
      };
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  static async deletePayment(id: string): Promise<void> {
    try {
      const data = storage.get();
      data.payments = data.payments.filter(p => p.id !== id);
      storage.set(data);
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }
}