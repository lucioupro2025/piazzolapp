
import { NextResponse, type NextRequest } from 'next/server';
import { orders, menuItems } from '@/lib/data';
import type { OrderStatus, CartItem } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// GET handler to fetch all orders
export async function GET() {
    return NextResponse.json(orders);
}

// Schema for validating new order items from the API
const cartItemSchema = z.object({
  menuItemId: z.string(),
  size: z.string(), // e.g., 'entera', 'media', '12', '6', 'unidad'
  quantity: z.number().int().min(1),
});

// Schema for validating the incoming order payload
const createOrderSchema = z.object({
    customerName: z.string().min(1),
    customerPhone: z.string().min(1),
    deliveryType: z.enum(['retiro', 'envio']),
    address: z.string().optional(),
    deliveryPersonId: z.string().optional(),
    delay: z.coerce.number().min(0).default(40),
    items: z.array(cartItemSchema).min(1),
}).refine(data => data.deliveryType === 'envio' ? !!data.address && data.address.length > 0 : true, {
  message: 'La dirección es requerida para envíos',
  path: ['address'],
}).refine(data => data.deliveryType === 'envio' ? !!data.deliveryPersonId : true, {
  message: 'El repartidor es requerido para envíos',
  path: ['deliveryPersonId'],
});

// POST handler to create a new order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = createOrderSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request body', details: parsed.error.format() }, { status: 400 });
        }

        const data = parsed.data;

        // --- Calculate total amount and build the final items array ---
        let totalAmount = 0;
        const finalItems: Omit<CartItem, 'id'>[] = [];

        for (const item of data.items) {
            const menuItem = menuItems.find(m => m.id === item.menuItemId);
            if (!menuItem) {
                return NextResponse.json({ error: `Menu item with ID ${item.menuItemId} not found` }, { status: 400 });
            }

            let unitPrice = 0;
            switch (item.size) {
                case 'entera':
                case '12':
                    unitPrice = menuItem.priceFull;
                    break;
                case 'media':
                case '6':
                    unitPrice = menuItem.priceHalf || 0;
                    break;
                case 'unidad':
                    unitPrice = menuItem.priceUnit || 0;
                    break;
                default:
                    // Fallback for items with a single price/size
                    unitPrice = menuItem.priceFull;
            }

            if (unitPrice <= 0) {
                 return NextResponse.json({ error: `Price for size '${item.size}' of item '${menuItem.name}' is not set or is invalid.` }, { status: 400 });
            }

            totalAmount += unitPrice * item.quantity;
            finalItems.push({
                menuItemId: item.menuItemId,
                name: menuItem.name,
                size: item.size,
                quantity: item.quantity,
                unitPrice: unitPrice,
            });
        }
        
        // --- Calculate estimated time ---
        const date = new Date();
        date.setMinutes(date.getMinutes() + data.delay);
        const estimatedTime = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        // --- Create the new order object ---
        const newOrder = {
            id: `P${Date.now()}`,
            items: finalItems,
            totalAmount: totalAmount,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            address: data.deliveryType === 'envio' ? data.address! : 'Retira en Local',
            deliveryType: data.deliveryType,
            delay: data.delay,
            estimatedTime: estimatedTime,
            status: 'nuevo' as OrderStatus,
            deliveryPersonId: data.deliveryPersonId,
            createdAt: new Date().toISOString(),
        };
        
        orders.unshift(newOrder);

        // --- Revalidate paths to update UI across the app ---
        revalidatePath('/');
        revalidatePath('/cocina');
        revalidatePath('/estadisticas');

        return NextResponse.json(newOrder, { status: 201 });

    } catch (error) {
        console.error('Order creation failed via API:', error);
        return NextResponse.json({ error: 'An unexpected error occurred during order creation' }, { status: 500 });
    }
}
