import { storage } from '../storage';

export interface Admin {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminsAPI {
  static async getAdminByCredentials(id: string, name: string): Promise<Admin | null> {
    try {
      const data = storage.get();
      const admin = data.admins.find(a => a.id === id && a.name === name);
      if (!admin) return null;
      
      return {
        ...admin,
        createdAt: new Date(admin.createdAt),
        updatedAt: new Date(admin.updatedAt),
      };
    } catch (error) {
      console.error('Error getting admin by credentials:', error);
      throw error;
    }
  }

  static async getAllAdmins(): Promise<Admin[]> {
    try {
      const data = storage.get();
      return data.admins.map(admin => ({
        ...admin,
        createdAt: new Date(admin.createdAt),
        updatedAt: new Date(admin.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting admins:', error);
      throw error;
    }
  }

  static async createAdmin(admin: Omit<Admin, 'createdAt' | 'updatedAt'>): Promise<Admin> {
    try {
      const data = storage.get();
      const newAdmin = {
        ...admin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      data.admins.push(newAdmin);
      storage.set(data);
      
      return {
        ...newAdmin,
        createdAt: new Date(newAdmin.createdAt),
        updatedAt: new Date(newAdmin.updatedAt),
      };
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }
}