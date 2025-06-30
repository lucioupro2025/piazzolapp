import { StatisticsDisplay } from '@/components/statistics/statistics-display';
import { getSalesData, getCancelledOrders } from '@/lib/api';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default async function StatisticsPage() {
  const sales = await getSalesData();
  const cancelledOrders = await getCancelledOrders();

  return (
    <div>
      <h1 className="text-4xl lg:text-5xl font-headline text-center mb-8 text-stone-800">
        Estadísticas y Registros
      </h1>
      <Suspense fallback={<StatisticsSkeleton />}>
        <StatisticsDisplay sales={sales} cancelledOrders={cancelledOrders} />
      </Suspense>
    </div>
  );
}

function StatisticsSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
}
