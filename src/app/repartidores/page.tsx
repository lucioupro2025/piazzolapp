import { redirect } from "next/navigation";
import { getDriverSession } from "@/lib/auth";
import { getDriverOrders } from "@/lib/api";
import { DeliveryDashboard } from "@/components/delivery/delivery-dashboard";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

export default async function RepartidoresPage() {
  const driver = getDriverSession();

  if (!driver) {
    redirect("/repartidores/login");
  }

  return (
    <Suspense fallback={<DashboardSkeleton/>}>
      <DashboardWrapper driverId={driver.id} driverName={driver.name} />
    </Suspense>
  );
}

async function DashboardWrapper({ driverId, driverName }: { driverId: string, driverName: string }) {
  const orders = await getDriverOrders(driverId);
  return <DeliveryDashboard driverName={driverName} initialOrders={orders} />;
}


function DashboardSkeleton() {
    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-10 w-24" />
            </div>
            <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg space-y-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-6 w-1/4" />
                            <Skeleton className="h-6 w-1/4" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex justify-end pt-4">
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
