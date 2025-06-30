import type { MenuItem, Order, DeliveryPerson, Category } from './types';

export const categories: Category[] = [
  { id: 'c1', name: 'Pizza', hasMultipleSizes: true },
  { id: 'c2', name: 'Empanada', hasMultipleSizes: true },
];

export const menuItems: MenuItem[] = [
  { id: '1', name: 'Muzzarella', ingredients: 'Salsa de tomate, muzzarella, aceitunas', category: 'Pizza', priceFull: 5800, priceHalf: 3200, available: true },
  { id: '2', name: 'Napolitana', ingredients: 'Salsa de tomate, muzzarella, rodajas de tomate, ajo, perejil', category: 'Pizza', priceFull: 6200, priceHalf: 3500, available: true },
  { id: '3', name: 'Fugazzeta', ingredients: 'Cebolla, muzzarella, aceitunas', category: 'Pizza', priceFull: 6200, priceHalf: 3500, available: false },
  { id: '4', name: 'Jamon y Morrones', ingredients: 'Salsa de tomate, muzzarella, jamón, morrones', category: 'Pizza', priceFull: 6800, priceHalf: 3800, available: true },
  { id: '5', name: 'Calabresa', ingredients: 'Salsa de tomate, muzzarella, longaniza', category: 'Pizza', priceFull: 7000, priceHalf: 4000, available: true },
  { id: '6', name: 'Empanada de Carne', ingredients: 'Carne picada, cebolla, huevo', category: 'Empanada', priceFull: 6000, priceHalf: 3200, available: true },
  { id: '7', name: 'Empanada de Jamón y Queso', ingredients: 'Jamón, queso', category: 'Empanada', priceFull: 5800, priceHalf: 3100, available: true },
  { id: '8', name: 'Empanada de Pollo', ingredients: 'Pollo, cebolla, morrón', category: 'Empanada', priceFull: 5800, priceHalf: 3100, available: false },
  { id: '9', name: 'Empanada de Humita', ingredients: 'Choclo, salsa blanca, queso', category: 'Empanada', priceFull: 5800, priceHalf: 3100, available: true },
];

export const deliveryPeople: DeliveryPerson[] = [
    { id: 'd1', name: 'Juan', password: '123' },
    { id: 'd2', name: 'Maria', password: '123' },
    { id: 'd3', name: 'Pedro', password: '123' },
];

export const orders: Order[] = [
    {
        id: `P${Date.now() - 300000}`,
        items: [{ menuItemId: '1', name: 'Muzzarella', quantity: 1, size: 'entera', unitPrice: 5800 }],
        totalAmount: 5800,
        customerName: 'Carlos Rodriguez',
        customerPhone: '1122334455',
        address: 'Av. Corrientes 1234, CABA',
        deliveryType: 'envio',
        delay: 40,
        estimatedTime: new Date(Date.now() + 10 * 60000).toISOString(),
        status: 'nuevo',
        deliveryPersonId: 'd1',
        createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
        id: `P${Date.now() - 200000}`,
        items: [
            { menuItemId: '2', name: 'Napolitana', quantity: 1, size: 'entera', unitPrice: 6200 },
            { menuItemId: '7', name: 'Empanada de Jamón y Queso', quantity: 1, size: '6', unitPrice: 3100 },
        ],
        totalAmount: 9300,
        customerName: 'Laura Gomez',
        customerPhone: '1166778899',
        address: 'Retira en Local',
        deliveryType: 'retiro',
        delay: 30,
        estimatedTime: new Date(Date.now() + 20 * 60000).toISOString(),
        status: 'preparacion',
        createdAt: new Date(Date.now() - 200000).toISOString(),
    },
    {
        id: `P${Date.now() - 100000}`,
        items: [{ menuItemId: '4', name: 'Jamon y Morrones', quantity: 2, size: 'entera', unitPrice: 6800 }],
        totalAmount: 13600,
        customerName: 'Ana Martinez',
        customerPhone: '1155443322',
        address: 'Av. Santa Fe 4321, CABA',
        deliveryType: 'envio',
        delay: 50,
        estimatedTime: new Date(Date.now() + 35 * 60000).toISOString(),
        status: 'listo',
        deliveryPersonId: 'd2',
        createdAt: new Date(Date.now() - 100000).toISOString(),
    }
];
