// Web-compatible storage layer using localStorage
// This simulates a database for development purposes

export interface StorageData {
  clients: any[];
  products: any[];
  vendors: any[];
  transactions: any[];
  payments: any[];
  settings: any;
  admins: any[];
}

const STORAGE_KEY = 'pedidos_adasoft_data';

// Initialize default data
const defaultData: StorageData = {
  clients: [],
  products: [],
  vendors: [
    {
      id: 'V001',
      name: 'Juan',
      lastname: 'Perez',
      cedula: '00112233445',
      phone: '555-1111',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'V002',
      name: 'Maria',
      lastname: 'Rodriguez',
      cedula: '00112233446',
      phone: '555-2222',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  transactions: [],
  payments: [],
  settings: {
    id: 'global',
    companyName: 'Mi Empresa',
    taxRate: 18,
    defaultCredit: 1000,
    orderPrefix: 'FA',
    address: '',
    phone: '',
    rnc: '',
    email: '',
    logo: '',
    taxIncluded: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  admins: [
    {
      id: 'ADMIN',
      name: 'Administrador',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]
};

// Storage utilities
export const storage = {
  get(): StorageData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Ensure all required properties exist
        return {
          ...defaultData,
          ...parsed,
        };
      }
    } catch (error) {
      console.error('Error reading from storage:', error);
    }
    return defaultData;
  },

  set(data: StorageData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};

// Initialize storage with default data if empty
export const initializeStorage = () => {
  const data = storage.get();
  if (!data || Object.keys(data).length === 0) {
    storage.set(defaultData);
  }
};

// Utility functions
export const generateId = (prefix: string = '') => {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
};