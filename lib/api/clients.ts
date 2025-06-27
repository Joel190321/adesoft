import { storage, generateId, formatDate } from '../storage';
import { Client } from '@/types/database';

export class ClientsAPI {
  static async getAllClients(): Promise<Client[]> {
    try {
      const data = storage.get();
      return data.clients.map(client => ({
        ...client,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting clients:', error);
      throw error;
    }
  }

  static async getClientById(id: string): Promise<Client | null> {
    try {
      const data = storage.get();
      const client = data.clients.find(c => c.id === id);
      if (!client) return null;
      
      return {
        ...client,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
      };
    } catch (error) {
      console.error('Error getting client:', error);
      throw error;
    }
  }

  static async createClient(client: Omit<Client, 'createdAt' | 'updatedAt'>): Promise<Client> {
    try {
      const data = storage.get();
      const newClient = {
        ...client,
        createdAt: formatDate(new Date()),
        updatedAt: formatDate(new Date()),
      };
      
      data.clients.push(newClient);
      storage.set(data);
      
      return {
        ...newClient,
        createdAt: new Date(newClient.createdAt),
        updatedAt: new Date(newClient.updatedAt),
      };
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  static async updateClient(id: string, updates: Partial<Client>): Promise<void> {
    try {
      const data = storage.get();
      const index = data.clients.findIndex(c => c.id === id);
      
      if (index === -1) {
        throw new Error('Client not found');
      }
      
      data.clients[index] = {
        ...data.clients[index],
        ...updates,
        updatedAt: formatDate(new Date()),
      };
      
      storage.set(data);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  static async deleteClient(id: string): Promise<void> {
    try {
      const data = storage.get();
      data.clients = data.clients.filter(c => c.id !== id);
      storage.set(data);
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }
}