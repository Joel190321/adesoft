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
  vendorId?: string;
  createdAt: Date;
  updatedAt: Date;
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
  sequentialId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  tax: number;
}

export interface Settings {
  id: string;
  companyName: string;
  taxRate: number;
  defaultCredit: number;
  orderPrefix: string;
  address: string;
  phone: string;
  rnc: string;
  email: string;
  logo: string;
  taxIncluded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  sequentialId?: number;
  cedula?: string;
  name: string;
  lastname?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TransactionType = 'FA' | 'RC';

export interface Transaction {
  id: string;
  control: string;
  document: string;
  type: TransactionType;
  date: Date;
  clientId: string;
  client: Client;
  vendorId: string;
  vendor: Vendor;
  value: number;
  pendingValue: number;
  items?: OrderItem[];
  subtotal?: number;
  tax?: number;
  referenceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentReference {
  id: string;
  controlRc: string;
  typeRc: string;
  controlFa: string;
  typeFa: string;
  clientId: string;
  vendorId: string;
  paymentAmount: number;
  createdAt: Date;
  updatedAt: Date;
}