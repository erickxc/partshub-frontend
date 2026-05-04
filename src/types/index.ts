export interface Product {
  id: string;
  name: string;
  brand?: string;
  internalCode?: string;
  manufacturerCode?: string;
  price: number;
  cost?: number;
  stock?: { quantity: number; minQuantity: number };
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  engine?: string;
}

export interface Customer {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
  product?: { name: string; internalCode?: string };
}

export interface Sale {
  id: string;
  total: number;
  discount: number;
  notes?: string;
  createdAt: string;
  customer?: { name: string };
  items: SaleItem[];
}

export interface StockItem {
  id: string;
  quantity: number;
  minQuantity: number;
  product: { id: string; name: string; brand?: string; internalCode?: string; price: number };
}
