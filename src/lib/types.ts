export type Category = {
  id: string;
  name: string;
  hasMultipleSizes: boolean;
};

export type MenuItem = {
  id: string;
  name: string;
  ingredients: string;
  category: string;
  priceFull: number; // Corresponds to 'entera' for pizza, '12' for empanadas, or unit price
  priceHalf?: number; // Corresponds to 'media' for pizza, '6' for empanadas
  priceUnit?: number; // Corresponds to 'unidad' for empanadas
  measurementUnit?: string; // For single-size items, e.g., 'unidad', '500ml'
  available: boolean;
};

export type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
};

export type OrderStatus = 'nuevo' | 'preparacion' | 'listo' | 'entregado' | 'cancelado';

export type Order = {
  id: string;
  items: Omit<CartItem, 'id'>[];
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  address: string;
  deliveryType: 'retiro' | 'envio';
  delay: number;
  estimatedTime: string;
  status: OrderStatus;
  deliveryPersonId?: string;
  createdAt: string;
};

export type DeliveryPerson = {
  id: string;
  name: string;
  password?: string;
};

export type Sale = {
  id: string;
  date: string;
  productName: string;
  category: string;
  quantity: number;
  totalPrice: number;
};
