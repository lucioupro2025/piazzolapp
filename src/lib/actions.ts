"use server";

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { CartItem, OrderStatus, DeliveryPerson, MenuItem, Category } from './types';
import { 
  addOrder, updateOrderStatusInDb, 
  fetchDeliveryPeople, upsertMenuItemInDb, 
  deleteMenuItemInDb, upsertDeliveryPersonInDb,
  deleteDeliveryPersonInDb, upsertCategoryInDb,
  deleteCategoryInDb
} from './data';
import { getDriverSession } from './auth';

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
  const newOrderData = {
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

  await addOrder(newOrderData);

  revalidatePath('/');
  revalidatePath('/cocina');
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await updateOrderStatusInDb(orderId, status);
  revalidatePath('/cocina');
  revalidatePath('/repartidores');
  revalidatePath('/estadisticas');
}

export async function reopenOrder(orderId: string) {
  await updateOrderStatusInDb(orderId, 'nuevo');
  revalidatePath('/cocina');
  revalidatePath('/estadisticas');
}

export async function loginDriver(prevState: { error: string | null }, formData: FormData) {
    const name = (formData.get('name') as string || '').trim();
    const password = (formData.get('password') as string || '').trim();

    if (!name || !password) {
        return { error: 'Nombre y contraseña son requeridos.' };
    }
    
    const deliveryPeople = await fetchDeliveryPeople();
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

// Menu Item Actions
export async function upsertMenuItem(formData: FormData) {
  const id = (formData.get('id') as string) || undefined;
  const data: Omit<MenuItem, 'id'> = {
    name: formData.get('name') as string,
    ingredients: formData.get('ingredients') as string,
    category: formData.get('category') as string,
    priceFull: parseFloat(formData.get('priceFull') as string),
    priceHalf: parseFloat(formData.get('priceHalf') as string) || undefined,
    priceUnit: parseFloat(formData.get('priceUnit') as string) || undefined,
    measurementUnit: (formData.get('measurementUnit') as string) || undefined,
    available: formData.get('available') === 'on',
  };

  await upsertMenuItemInDb(data, id);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function deleteMenuItem(id: string) {
    await deleteMenuItemInDb(id);
    revalidatePath('/admin');
    revalidatePath('/');
}

// Delivery Person Actions
export async function upsertDeliveryPerson(formData: FormData) {
    const id = (formData.get('id') as string) || undefined;
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    await upsertDeliveryPersonInDb(name, password, id);
    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath('/cocina');
    revalidatePath('/repartidores');
}

export async function deleteDeliveryPerson(id: string) {
    await deleteDeliveryPersonInDb(id);
    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath('/cocina');
    revalidatePath('/repartidores');
}

// Category Actions
export async function upsertCategory(formData: FormData) {
    const id = (formData.get('id') as string) || undefined;
    const data: Omit<Category, 'id'> = {
        name: formData.get('name') as string,
        hasMultipleSizes: formData.get('hasMultipleSizes') === 'on',
    };

    await upsertCategoryInDb(data, id);
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function deleteCategory(id: string) {
    await deleteCategoryInDb(id);
    revalidatePath('/admin');
    revalidatePath('/');
}
