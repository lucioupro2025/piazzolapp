
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { addOrder, fetchOrders, fetchMenuItems } from '@/lib/data';
import type { Order, MenuItem, OrderStatus, CartItem } from '@/lib/types';

interface OrderItem {
  menuItemId: string;
  quantity: number;
  size: string; // 'entera', 'media', '6', '12', 'unidad'
}

interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  address: string;
  deliveryType: 'retiro' | 'envio';
  items: OrderItem[];
  delay?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();

    // Validar campos requeridos
    const requiredFields = ['customerName', 'customerPhone', 'address', 'deliveryType', 'items'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Campos requeridos faltantes',
          missing: missingFields
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido debe tener al menos un item' },
        { status: 400 }
      );
    }

    if (!/^\d{8,15}$/.test(body.customerPhone.replace(/[\s\-\(\)]/g, ''))) {
      return NextResponse.json(
        { error: 'Formato de teléfono inválido' },
        { status: 400 }
      );
    }

    const menuItems = await fetchMenuItems();
    const processedItems: Omit<CartItem, 'id'>[] = [];
    let totalAmount = 0;
    const errors = [];

    for (const item of body.items) {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      
      if (!menuItem) {
        errors.push(`Producto con ID ${item.menuItemId} no encontrado`);
        continue;
      }

      if (!menuItem.available) {
        errors.push(`${menuItem.name} no está disponible`);
        continue;
      }

      let unitPrice = 0;
      let validSize = false;

      switch (item.size) {
        case 'entera':
          if (menuItem.priceFull) {
            unitPrice = menuItem.priceFull;
            validSize = true;
          }
          break;
        case 'media':
          if (menuItem.priceHalf) {
            unitPrice = menuItem.priceHalf;
            validSize = true;
          }
          break;
        case '12':
          if (menuItem.priceFull && menuItem.category === 'Empanada') {
            unitPrice = menuItem.priceFull;
            validSize = true;
          }
          break;
        case '6':
          if (menuItem.priceHalf && menuItem.category === 'Empanada') {
            unitPrice = menuItem.priceHalf;
            validSize = true;
          }
          break;
        case 'unidad':
          if (menuItem.priceUnit) {
            unitPrice = menuItem.priceUnit;
            validSize = true;
          }
          break;
      }

      if (!validSize) {
        errors.push(`Tamaño '${item.size}' no válido para ${menuItem.name}`);
        continue;
      }

      if (!item.quantity || item.quantity < 1) {
        errors.push(`Cantidad inválida para ${menuItem.name}`);
        continue;
      }

      processedItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        size: item.size,
        unitPrice: unitPrice
      });

      totalAmount += unitPrice * item.quantity;
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Errores en los items del pedido',
          details: errors
        },
        { status: 400 }
      );
    }

    const orderDelay = body.delay || (body.deliveryType === 'envio' ? 45 : 30);
    const estimatedTime = new Date(Date.now() + orderDelay * 60000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const newOrderData = {
      items: processedItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      address: body.address.trim(),
      deliveryType: body.deliveryType,
      delay: orderDelay,
      estimatedTime,
      status: 'nuevo' as OrderStatus,
      deliveryPersonId: body.deliveryType === 'envio' ? undefined : undefined,
      createdAt: new Date().toISOString(),
    };
    
    const newOrder = await addOrder(newOrderData);

    revalidatePath('/');
    revalidatePath('/cocina');
    revalidatePath('/estadisticas');

    return NextResponse.json({
      success: true,
      order: {
        id: newOrder.id,
        ...newOrderData,
        items: processedItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          size: item.size,
          unitPrice: item.unitPrice,
          subtotal: item.unitPrice * item.quantity
        }))
      },
      message: 'Pedido creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear pedido:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: 'No se pudo crear el pedido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const status = searchParams.get('status') as OrderStatus | null;
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredOrders = await fetchOrders({ status, limit, orderId });

    return NextResponse.json({
      success: true,
      orders: filteredOrders,
      total: filteredOrders.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al consultar pedidos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
