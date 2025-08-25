// Web-compatible storage layer using localStorage
// This simulates a database for development purposes

// Prisma-based types
export interface Producto {
  IdProducto: number;
  CodigoP: string;
  ReferenciaP?: string;
  PresentacionP?: string;
  NombreP: string;
  PrecioP?: number;
  ImpuestoP?: number;
  ExentoP?: number;
  ExistenciaP?: number;
  GrupoP: string;
  FechaSinc?: string;
}

export interface Vendedor {
  IdVendedor: string;
  CedulaV?: string;
  NombreV: string;
  TelefonoV?: string;
  IdRuta?: string;
  FechaSinc?: string;
}

export interface Cliente {
  IdCliente: string;
  NombreC: string;
  Rnc?: string;
  TelefonoC?: string;
  DireccionC1?: string;
  DireccionC2?: string;
  ClienteExento?: number;
  BalanceC?: number;
  IdVendedor?: string;
  FechaSinc?: string;
}

export interface Orden {
  IdOrden: number;
  Documento: string;
  Fecha: string;
  IdCliente: string;
  IdVendedor: string;
  Subtotal?: number;
  Impuesto?: number;
  ValorImp?: number;
  Total?: number;
  Estado?: 'A' | 'P' | 'N';
  FechaCreacion?: string;
  FechaSinc?: string;
}

export interface OrdenItem {
  IdOrden: number;
  IdProducto: number;
  Cantidad?: number;
  PrecioV?: number;
  Impuesto?: number;
}

export interface Config {
  IdConfig: number;
  Compania: string;
  Direccion1?: string;
  Direccion2?: string;
  Telefono?: string;
  Rnc?: string;
  Email?: string;
  Impuesto: number;
  OrdenNo?: string;
  IngresoNo?: string;
  Logo?: string;
  TipoImpuesto?: 'I' | 'A';
}

export interface Transaccion {
  IdTransa: number;
  Documento?: string;
  Tipo?: 'VE' | 'IN';
  Fecha: string;
  FechaCreacion?: string;
  IdCliente: string;
  IdVendedor: string;
  Valor?: number;
  Pendiente?: number;
  ValorImp?: number;
  ReferenciaId?: string;
  Concepto?: string;
  FechaSinc?: string;
}

export interface ReferenciaPago {
  IdReferencia: number;
  IdTransa: number;
  DocumentoIN?: string;
  DocumentoVE?: string;
  IdCliente?: string;
  IdVendedor?: string;
  ValorPago: number;
  CreatedAt?: string;
}

export interface StorageData {
  productos: Producto[];
  vendedores: Vendedor[];
  clientes: Cliente[];
  ordenes: Orden[];
  ordenItems: OrdenItem[];
  configs: Config[];
  transacciones: Transaccion[];
  referenciasPago: ReferenciaPago[];
}

const STORAGE_KEY = 'pedidos_adesoft_data';

// Initialize default data
const defaultData: StorageData = {
  productos: [],
  vendedores: [],
  clientes: [],
  ordenes: [],
  ordenItems: [],
  configs: [],
  transacciones: [],
  referenciasPago: [],
};


// Storage utilities with backend fallback
export const storage = {
  get(): StorageData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
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
  },

  async getProductos(): Promise<Producto[]> {
    try {
      const apiUrl = (await import('@/config')).apiUrl;
      const res = await fetch(`${apiUrl}productos`);
      if (!res.ok) throw new Error('Backend error');
      const productos = await res.json();
      // Optionally update localStorage
      const data = storage.get();
      data.productos = productos;
      storage.set(data);
      return productos;
    } catch (error) {
      // Fallback to localStorage
      console.warn('Falling back to localStorage for productos:', error);
      return storage.get().productos;
    }
  },
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