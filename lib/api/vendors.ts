import { storage, generateId, formatDate } from '../storage';
import { Vendor } from '@/types/database';

export class VendorsAPI {
  static async getAllVendors(): Promise<Vendor[]> {
    try {
      const data = storage.get();
      return data.vendors.map(vendor => ({
        ...vendor,
        createdAt: vendor.createdAt ? new Date(vendor.createdAt) : new Date(),
        updatedAt: vendor.updatedAt ? new Date(vendor.updatedAt) : new Date(),
      }));
    } catch (error) {
      console.error('Error getting vendors:', error);
      throw error;
    }
  }

  static async getVendorById(id: string): Promise<Vendor | null> {
    try {
      const data = storage.get();
      const vendor = data.vendors.find(v => v.id === id);
      if (!vendor) return null;
      
      return {
        ...vendor,
        createdAt: vendor.createdAt ? new Date(vendor.createdAt) : new Date(),
        updatedAt: vendor.updatedAt ? new Date(vendor.updatedAt) : new Date(),
      };
    } catch (error) {
      console.error('Error getting vendor:', error);
      throw error;
    }
  }

  static async getVendorByCredentials(id: string, name: string): Promise<Vendor | null> {
    try {
      const data = storage.get();
      const vendor = data.vendors.find(v => v.id === id && v.name === name);
      if (!vendor) return null;
      
      return {
        ...vendor,
        createdAt: vendor.createdAt ? new Date(vendor.createdAt) : new Date(),
        updatedAt: vendor.updatedAt ? new Date(vendor.updatedAt) : new Date(),
      };
    } catch (error) {
      console.error('Error getting vendor by credentials:', error);
      throw error;
    }
  }

  static async createVendor(vendor: Omit<Vendor, 'sequentialId' | 'createdAt' | 'updatedAt'>): Promise<Vendor> {
    try {
      const data = storage.get();
      const newVendor = {
        ...vendor,
        createdAt: formatDate(new Date()),
        updatedAt: formatDate(new Date()),
      };
      
      data.vendors.push(newVendor);
      storage.set(data);
      
      return {
        ...newVendor,
        createdAt: new Date(newVendor.createdAt),
        updatedAt: new Date(newVendor.updatedAt),
      };
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  }

  static async updateVendor(id: string, updates: Partial<Vendor>): Promise<void> {
    try {
      const data = storage.get();
      const index = data.vendors.findIndex(v => v.id === id);
      
      if (index === -1) {
        throw new Error('Vendor not found');
      }
      
      data.vendors[index] = {
        ...data.vendors[index],
        ...updates,
        updatedAt: formatDate(new Date()),
      };
      
      storage.set(data);
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  }

  static async deleteVendor(id: string): Promise<void> {
    try {
      const data = storage.get();
      data.vendors = data.vendors.filter(v => v.id !== id);
      storage.set(data);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  }
}