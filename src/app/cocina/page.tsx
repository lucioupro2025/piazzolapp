import { KitchenDisplay } from '@/components/kitchen/kitchen-display';
import { getKitchenOrders } from '@/lib/api';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default function KitchenPage() {
  return (
    <div>
      <h1 className="text-4xl lg:text-5xl font-headline text-center mb-8 text-stone-800">
        Pedidos en Cocina
      </h1>
      <Suspense fallback={<KitchenLoadingSkeleton />}>
        <KitchenDisplayWrapper />
      </Suspense>
    </div>
  );
}

async function KitchenDisplayWrapper() {
    const initialOrders = await getKitchenOrders();
    return <KitchenDisplay initialOrders={initialOrders} />
}

function KitchenLoadingSkeleton() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex justify-end gap-2 pt-4">
                <Skeleton className="h-10 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }
