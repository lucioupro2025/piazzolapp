import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { getMenuItems, getDeliveryPeople, getCategories } from '@/lib/api';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const menuItems = await getMenuItems();
    const deliveryPeople = await getDeliveryPeople();
    const categories = await getCategories();

  return (
    <div>
      <h1 className="text-4xl lg:text-5xl font-headline text-center mb-8 text-stone-800">
        Panel de Administración
      </h1>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminDashboard menuItems={menuItems} deliveryPeople={deliveryPeople} categories={categories} />
      </Suspense>
    </div>
  );
}

function AdminSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex space-x-4 border-b">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
            </div>
            <div className="flex justify-end">
                <Skeleton className="h-10 w-36" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    );
}
