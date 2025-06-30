"use server";

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { CartItem, OrderStatus } from './types';
import { orders, deliveryPeople } from './data';

interface OrderData {
  customerName: string;
  customerPhone: string;
  deliveryType: 'retiro' | 'envio';
  address?: string;
  deliveryPersonId?: string;
  delay: number;
  cart: CartItem[];
  totalAmount: number;
  estimatedTime: string;
}

export async function createOrder(data: OrderData) {
  const newOrder = {
    id: `P${Date.now()}`,
    items: data.cart.map(({ id, ...rest }) => rest), // remove client-side-only id
    totalAmount: data.totalAmount,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    address: data.address || 'Retira en Local',
    deliveryType: data.deliveryType,
    delay: data.delay,
    estimatedTime: data.estimatedTime,
    status: 'nuevo' as OrderStatus,
    deliveryPersonId: data.deliveryPersonId,
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);

  revalidatePath('/');
  revalidatePath('/cocina');
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    orders[orderIndex].status = status;
    revalidatePath('/cocina');
    revalidatePath('/repartidores');
  }
}

export async function loginDriver(formData: FormData) {
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    const driver = deliveryPeople.find(d => d.name.toLowerCase() === name.toLowerCase() && d.password === password);

    if (driver) {
        cookies().set('driver_session', driver.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });
        redirect('/repartidores');
    } else {
        return { error: 'Nombre o contraseña incorrectos.' };
    }
}

export async function logoutDriver() {
    cookies().delete('driver_session');
    redirect('/repartidores/login');
}
