"use client";

import { useState, useTransition, type FC } from "react";
import { logoutDriver, updateOrderStatus } from "@/lib/actions";
import type { Order } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { LogOut, User, Phone, MapPin, ExternalLink, CheckCircle2, PackageCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeliveryDashboardProps {
  driverName: string;
  initialOrders: Order[];
}

const OrderCard: FC<{ order: Order; onDeliver: (orderId: string) => void }> = ({ order, onDeliver }) => {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;

  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
    >
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-secondary/50 p-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">Pedido #{order.id.slice(-4)}</CardTitle>
          <Badge className="text-lg">${order.totalAmount.toLocaleString('es-AR')}</Badge>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">{order.customerName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <span>{order.customerPhone}</span>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <p>{order.address}</p>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                Ver en Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <Separator className="my-3"/>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {order.items.map((item, index) => (
                <li key={index}>
                    {item.quantity}x {item.name} ({item.size})
                </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="bg-secondary/50 p-4">
          <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={() => onDeliver(order.id)}>
            <CheckCircle2 className="mr-2 h-5 w-5" /> Marcar como Entregado
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export function DeliveryDashboard({ driverName, initialOrders }: DeliveryDashboardProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDeliver = (orderId: string) => {
    startTransition(async () => {
      await updateOrderStatus(orderId, 'entregado');
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast({
        title: "¡Pedido entregado!",
        description: `El pedido #${orderId.slice(-4)} ha sido marcado como entregado.`,
        className: "bg-green-100 border-green-300 text-green-800"
      })
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-headline text-stone-800">
          Hola, <span className="text-primary">{driverName}</span>!
        </h1>
        <form action={logoutDriver}>
          <Button variant="outline" type="submit">
            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
          </Button>
        </form>
      </div>
      
      <h2 className="text-2xl font-headline mb-6">Tus entregas pendientes:</h2>
      
      {orders.length > 0 ? (
        <div className="space-y-6">
            <AnimatePresence>
                {orders.map(order => (
                    <OrderCard key={order.id} order={order} onDeliver={handleDeliver} />
                ))}
            </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-secondary/30">
            <PackageCheck className="mx-auto h-16 w-16 text-green-500" />
            <p className="mt-4 text-xl font-bold font-headline text-green-700">¡No tienes entregas pendientes!</p>
            <p className="text-muted-foreground mt-1">Buen trabajo. Descansa un poco.</p>
        </div>
      )}
    </div>
  );
}
