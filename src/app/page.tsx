import { OrderForm } from '@/components/order/order-form';
import { getMenuItems, getDeliveryPeople, getCategories } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function OrderPage() {
  const menu = await getMenuItems();
  const deliveryPeople = await getDeliveryPeople();
  const categories = await getCategories();

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-4xl lg:text-5xl font-headline text-center mb-8 text-stone-800">
        Tomar Pedido
      </h1>
      <OrderForm menu={menu} deliveryPeople={deliveryPeople} categories={categories} />
    </div>
  );
}
