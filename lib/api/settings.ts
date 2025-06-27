import { storage, formatDate } from '../storage';
import { Settings } from '@/types/database';

export class SettingsAPI {
  static async getSettings(): Promise<Settings | null> {
    try {
      const data = storage.get();
      if (!data.settings) return null;
      
      return {
        ...data.settings,
        createdAt: new Date(data.settings.createdAt),
        updatedAt: new Date(data.settings.updatedAt),
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }

  static async updateSettings(updates: Partial<Settings>): Promise<void> {
    try {
      const data = storage.get();
      
      data.settings = {
        ...data.settings,
        ...updates,
        updatedAt: formatDate(new Date()),
      };
      
      storage.set(data);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
}