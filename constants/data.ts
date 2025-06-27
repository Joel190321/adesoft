// Sample data for development purposes

export interface Client {
  id: string;
  name: string;
  rnc?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  isExempt?: boolean;
  debit?: number;
  credit?: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  tax: number;
  stock: number;
  category: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  tax: number;
}

export interface Order {
  id: string;
  date: Date;
  clientId: string;
  client?: Client;
  vendorId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'completed' | 'cancelled';
}

export interface Vendor {
  id: string;
  cedula: string;
  name: string;
  lastname: string;
  phone: string;
}

// Sample data
export const clients: Client[] = [
  {
    id: '1',
    name: 'Supermercado ABC',
    rnc: '123456789',
    phone: '555-1234',
    address1: 'Calle Principal #42',
    address2: 'Sector Comercial',
    isExempt: false,
    debit: 0,
    credit: 1000,
  },
  {
    id: '2',
    name: 'Tienda XYZ',
    rnc: '987654321',
    phone: '555-5678',
    address1: 'Av. Central #156',
    address2: 'Plaza Comercial',
    isExempt: true,
    debit: 0,
    credit: 2500,
  },
  {
    id: '3',
    name: 'Farmacia Salud',
    rnc: '456789123',
    phone: '555-9101',
    address1: 'Calle Secundaria #78',
    address2: '',
    isExempt: false,
    debit: 500,
    credit: 1000,
  },
];

export const products: Product[] = [
  {
    id: '1',
    code: 'P001',
    name: 'Agua Mineral',
    description: 'Botella de agua mineral 500ml',
    price: 25,
    tax: 18,
    stock: 100,
    category: 'Bebidas',
  },
  {
    id: '2',
    code: 'P002',
    name: 'Refresco Cola',
    description: 'Lata de refresco cola 355ml',
    price: 35,
    tax: 18,
    stock: 80,
    category: 'Bebidas',
  },
  {
    id: '3',
    code: 'P003',
    name: 'Galletas Chocolate',
    description: 'Paquete de galletas con chocolate 200g',
    price: 45,
    tax: 18,
    stock: 50,
    category: 'Snacks',
  },
  {
    id: '4',
    code: 'P004',
    name: 'Papel Higiénico',
    description: 'Paquete de 4 rollos papel higiénico',
    price: 120,
    tax: 18,
    stock: 40,
    category: 'Hogar',
  },
  {
    id: '5',
    code: 'P005',
    name: 'Detergente',
    description: 'Detergente en polvo 500g',
    price: 85,
    tax: 18,
    stock: 30,
    category: 'Limpieza',
  },
];

export const vendors: Vendor[] = [
  {
    id: 'V001',
    cedula: '00112233445',
    name: 'Juan',
    lastname: 'Perez',
    phone: '555-1111',
  },
  {
    id: 'V002',
    cedula: '00112233446',
    name: 'Maria',
    lastname: 'Rodriguez',
    phone: '555-2222',
  }
];

export const orders: Order[] = [];

// App configuration
export const AppData = {
  clients,
  products,
  vendors,
  orders,
  currentVendor: vendors[0],
};

export default AppData;