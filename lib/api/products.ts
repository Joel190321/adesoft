import { storage, generateId, formatDate } from '../storage';
import { Product } from '@/types/database';

export class ProductsAPI {
  static async getAllProducts(): Promise<Product[]> {
    try {
      const data = storage.get();
      return data.products.map(product => ({
        ...product,
        createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
        updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      }));
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  static async getProductById(id: string): Promise<Product | null> {
    try {
      const data = storage.get();
      const product = data.products.find(p => p.id === id);
      if (!product) return null;
      
      return {
        ...product,
        createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
        updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      };
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  }

  static async getNextSequentialId(): Promise<number> {
    try {
      const data = storage.get();
      const maxId = data.products.reduce((max, product) => {
        return Math.max(max, product.sequentialId || 0);
      }, 0);
      return maxId + 1;
    } catch (error) {
      console.error('Error getting next sequential ID:', error);
      throw error;
    }
  }

  static async createProduct(product: Omit<Product, 'sequentialId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      const data = storage.get();
      const sequentialId = await this.getNextSequentialId();
      const code = `P${String(sequentialId).padStart(4, '0')}`;
      
      const newProduct = {
        ...product,
        sequentialId,
        code,
        createdAt: formatDate(new Date()),
        updatedAt: formatDate(new Date()),
      };
      
      data.products.push(newProduct);
      storage.set(data);
      
      return {
        ...newProduct,
        createdAt: new Date(newProduct.createdAt),
        updatedAt: new Date(newProduct.updatedAt),
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const data = storage.get();
      const index = data.products.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw new Error('Product not found');
      }
      
      data.products[index] = {
        ...data.products[index],
        ...updates,
        updatedAt: formatDate(new Date()),
      };
      
      storage.set(data);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  static async deleteProduct(id: string): Promise<void> {
    try {
      const data = storage.get();
      data.products = data.products.filter(p => p.id !== id);
      storage.set(data);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
}