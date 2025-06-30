
import { NextResponse, type NextRequest } from 'next/server';
import { menuItems } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// GET handler to retrieve stock for all products
export async function GET() {
  const stockInfo = menuItems.map(item => ({
    id: item.id,
    name: item.name,
    available: item.available,
  }));
  return NextResponse.json(stockInfo);
}

// Schema for validating the PATCH request body
const updateStockSchema = z.object({
  id: z.string(),
  available: z.boolean(),
});

// PATCH handler to update a single product's availability
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateStockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.format() }, { status: 400 });
    }

    const { id, available } = parsed.data;

    const itemIndex = menuItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    menuItems[itemIndex].available = available;

    // Revalidate paths where this data is used to reflect the change in the UI
    revalidatePath('/admin');
    revalidatePath('/');

    return NextResponse.json(menuItems[itemIndex]);
  } catch (error) {
    console.error('Stock update failed via API:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
