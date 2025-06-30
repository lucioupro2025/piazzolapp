"use client";

import { useState, useTransition, type FC, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import type { Order, OrderStatus, DeliveryPerson } from '@/lib/types';
import { updateOrderStatus } from '@/lib/actions';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, User, ChefHat, ShoppingBag, ArrowRight, Check, Trash2, RefreshCw, Bike } from 'lucide-react';
import { getKitchenOrders } from '@/lib/api';

interface KitchenDisplayProps {
  initialOrders: Order[];
  deliveryPeople: DeliveryPerson[];
}

const statusConfig: Record<OrderStatus, { text: string; color: string; next?: OrderStatus; nextText?: string }> = {
  nuevo: { text: "Nuevo", color: "bg-orange-400 text-orange-900", next: "preparacion", nextText: "Preparar" },
  preparacion: { text: "En Preparación", color: "bg-yellow-300 text-yellow-900", next: "listo", nextText: "¡Listo!" },
  listo: { text: "Listo para Entregar", color: "bg-green-400 text-green-900", next: "entregado", nextText: "Entregado" },
  entregado: { text: "Entregado", color: "bg-gray-400 text-gray-900" },
  cancelado: { text: "Cancelado", color: "bg-red-500 text-white" },
};

const OrderCard: FC<{ order: Order, onStatusChange: (orderId: string, status: OrderStatus) => void, deliveryPersonName?: string }> = ({ order, onStatusChange, deliveryPersonName }) => {
  const config = statusConfig[order.status];
  const nextStatus = config.next;
  const [formattedTime, setFormattedTime] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted,
    // preventing a hydration mismatch between server and client-rendered HTML.
    const date = new Date(order.estimatedTime);
    if (!isNaN(date.getTime())) {
      setFormattedTime(date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    } else {
      // If `order.estimatedTime` is not a valid date (e.g., already formatted), display it directly.
      setFormattedTime(order.estimatedTime);
    }
  }, [order.estimatedTime]);
  
  return (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.4, type: "spring" }}
    >
        <Card className={cn("flex flex-col h-full shadow-lg border-2", config.color.replace('bg-', 'border-'))}>
            <CardHeader className={cn("p-4", config.color)}>
                <CardTitle className="flex justify-between items-center text-xl font-bold">
                    <span>Pedido #{order.id.slice(-4)}</span>
                    <Badge variant="secondary" className="text-lg">{config.text}</Badge>
                </CardTitle>
                <div className="text-sm flex justify-between">
                    <span><Clock className="inline h-4 w-4 mr-1" />{formattedTime ?? '...'}</span>
                    <span><User className="inline h-4 w-4 mr-1" />{order.customerName}</span>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <ul className="space-y-2">
                    {order.items.map((item, index) => (
                        <li key={index} className="flex justify-between items-center">
                            <span><span className='font-bold'>{item.quantity}x</span> {item.name}</span>
                            <span className="text-muted-foreground text-sm capitalize">{item.size.replace('entera', 'E').replace('media', 'M')}</span>
                        </li>
                    ))}
                </ul>
                <Separator className="my-3" />
                <div className='flex justify-between items-center'>
                    <Badge variant={order.deliveryType === 'envio' ? "default" : "secondary"} className="capitalize">
                        {order.deliveryType === 'envio' ? <ChefHat className="h-4 w-4 mr-2"/> : <ShoppingBag className="h-4 w-4 mr-2"/>}
                        {order.deliveryType}
                    </Badge>
                     {order.deliveryType === 'envio' && deliveryPersonName && (
                        <div className="text-sm flex items-center gap-1 text-muted-foreground font-medium">
                            <Bike className="h-4 w-4" />
                            <span>{deliveryPersonName}</span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 flex justify-between items-center">
                <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100" onClick={() => onStatusChange(order.id, 'cancelado')}>
                    <Trash2 className="h-5 w-5" />
                </Button>
                {nextStatus && config.nextText && (
                    <Button onClick={() => onStatusChange(order.id, nextStatus)} className="bg-white text-black hover:bg-gray-200 shadow-md">
                        {config.nextText}
                        {nextStatus === 'listo' ? <Check className="ml-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                )}
            </CardFooter>
        </Card>
    </motion.div>
  );
};

export function KitchenDisplay({ initialOrders, deliveryPeople }: KitchenDisplayProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    startTransition(async () => {
      await updateOrderStatus(orderId, status);
      // Optimistically update UI
      setOrders(prev => prev.filter(o => o.id !== orderId));
    });
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const refreshedOrders = await getKitchenOrders();
    setOrders(refreshedOrders);
    setIsRefreshing(false);
  }

  return (
    <div>
        <div className="text-right mb-4">
            <Button onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                Actualizar
            </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
                {orders.map(order => {
                    const deliveryPerson = deliveryPeople.find(d => d.id === order.deliveryPersonId);
                    return (
                     <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} deliveryPersonName={deliveryPerson?.name} />
                    )
                })}
            </AnimatePresence>
        </div>
        {orders.length === 0 && (
            <div className="text-center py-20">
                <p className="text-2xl font-bold font-headline text-green-600">¡Todo listo por ahora!</p>
                <p className="text-muted-foreground mt-2">No hay pedidos pendientes en la cocina.</p>
            </div>
        )}
    </div>
  );
}
