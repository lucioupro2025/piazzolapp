import { fetchMenuItems, fetchOrders, fetchDeliveryPeople, fetchCategories } from './data';
import type { OrderStatus, Sale } from './types';

export async function getMenuItems() {
  return fetchMenuItems();
}

export async function getCategories() {
  return fetchCategories();
}

export async function getDeliveryPeople() {
  return fetchDeliveryPeople();
}

export async function getOrders() {
  return fetchOrders({});
}

export async function getKitchenOrders() {
  const kitchenStatuses: OrderStatus[] = ['nuevo', 'preparacion', 'listo'];
  const orders = await fetchOrders({ statuses: kitchenStatuses });

  return orders.sort((a, b) => {
      const statusOrder = { 'nuevo': 0, 'preparacion': 1, 'listo': 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

export async function getDriverOrders(driverId: string) {
  return fetchOrders({ deliveryPersonId: driverId, status: 'listo' });
}

export async function getSalesData(): Promise<Sale[]> {
    const deliveredOrders = await fetchOrders({ status: 'entregado' });
    const menuItems = await fetchMenuItems();
    const salesData: Sale[] = [];

    deliveredOrders.forEach(order => {
        order.items.forEach((item, index) => {
            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
            if (menuItem) {
                salesData.push({
                    id: `${order.id}-${index}`,
                    date: order.createdAt,
                    productName: `${item.name} (${item.size.charAt(0).toUpperCase() + item.size.slice(1)})`,
                    category: menuItem.category,
                    quantity: item.quantity,
                    totalPrice: item.unitPrice * item.quantity,
                });
            }
        });
    });

    return salesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getCancelledOrders() {
  return fetchOrders({ status: 'cancelado' });
}
