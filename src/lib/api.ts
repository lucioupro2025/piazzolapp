import { menuItems, orders, deliveryPeople } from './data';
import type { OrderStatus } from './types';

// Simulate API delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function getMenuItems() {
  await delay(50);
  return menuItems;
}

export async function getDeliveryPeople() {
  await delay(50);
  return deliveryPeople;
}

export async function getOrders() {
  await delay(100);
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getKitchenOrders() {
  await delay(100);
  const kitchenStatuses: OrderStatus[] = ['nuevo', 'preparacion', 'listo'];
  // Return a copy to avoid mutation issues in server components
  const filteredOrders = [...orders]
    .filter(o => kitchenStatuses.includes(o.status))
    .sort((a, b) => {
      const statusOrder = { 'nuevo': 0, 'preparacion': 1, 'listo': 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  return filteredOrders;
}

export async function getDriverOrders(driverId: string) {
  await delay(100);
  return [...orders]
    .filter(o => o.deliveryPersonId === driverId && o.status === 'listo')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
