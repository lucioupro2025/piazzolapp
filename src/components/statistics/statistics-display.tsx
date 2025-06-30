"use client";

import { useTransition, type FC } from 'react';
import type { Sale, Order } from '@/lib/types';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip, PieChart, Pie, Cell } from "recharts";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { reopenOrder } from '@/lib/actions';
import { RefreshCcw } from 'lucide-react';

interface StatisticsDisplayProps {
  sales: Sale[];
  cancelledOrders: Order[];
}

const barChartConfig = {
  sales: {
    label: "Ventas",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export const StatisticsDisplay: FC<StatisticsDisplayProps> = ({ sales, cancelledOrders }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleReopen = (orderId: string) => {
      startTransition(async () => {
          try {
              await reopenOrder(orderId);
              toast({
                  title: "Pedido Reactivado",
                  description: `El pedido #${orderId.slice(-4)} ha sido enviado nuevamente a la cocina.`
              });
          } catch (error) {
              toast({
                  variant: 'destructive',
                  title: "Error",
                  description: "No se pudo reactivar el pedido."
              })
          }
      });
  }

  const { totalRevenue, totalProductsSold, mostSoldProduct } = useMemo(() => {
    let revenue = 0;
    let productsSold = 0;
    const productCounts: { [key: string]: number } = {};

    sales.forEach(sale => {
      revenue += sale.totalPrice;
      productsSold += sale.quantity;
      productCounts[sale.productName] = (productCounts[sale.productName] || 0) + sale.quantity;
    });
    
    const mostSold = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalRevenue: revenue,
      totalProductsSold: productsSold,
      mostSoldProduct: mostSold ? `${mostSold[0]} (${mostSold[1]} uds)` : 'N/A',
    };
  }, [sales]);

  const salesByDay = useMemo(() => {
    const data: { [key: string]: number } = {};
    sales.forEach(sale => {
      const day = format(new Date(sale.date), 'yyyy-MM-dd');
      data[day] = (data[day] || 0) + sale.totalPrice;
    });
    return Object.entries(data)
      .map(([date, sales]) => ({ date, sales }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sales]);
  
  const { salesByCategory, pieChartConfig } = useMemo(() => {
    const categoryData: { [key: string]: number } = {};
    sales.forEach(sale => {
        categoryData[sale.category] = (categoryData[sale.category] || 0) + sale.totalPrice;
    });

    const pieData = Object.entries(categoryData)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);

    const config = pieData.reduce((acc, entry) => {
        acc[entry.name] = { label: entry.name };
        return acc;
    }, {} as ChartConfig);

    return { salesByCategory: pieData, pieChartConfig: config };
  }, [sales]);

  const PIE_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--secondary))",
    "hsl(24, 80%, 70%)",
    "hsl(160, 70%, 50%)",
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos Totales</CardTitle>
            <CardDescription>Total de ingresos de todos los pedidos entregados.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalRevenue.toLocaleString('es-AR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Productos Vendidos</CardTitle>
            <CardDescription>Cantidad total de productos individuales vendidos.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalProductsSold}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Producto Más Vendido</CardTitle>
             <CardDescription>El producto más popular entre los clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{mostSoldProduct}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
            <CardTitle>Ventas por Día</CardTitle>
            <CardDescription>Ingresos de los últimos días con pedidos entregados.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={barChartConfig} className="min-h-[300px] w-full">
                    <BarChart data={salesByDay} accessibilityLayer margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => format(new Date(value), "d MMM", { locale: es })}
                        />
                        <YAxis
                            domain={[0, 900000]}
                            tickFormatter={(value) => `$${Number(value) / 1000}k`}
                        />
                        <Tooltip 
                            cursor={false}
                            content={<ChartTooltipContent 
                                formatter={(value) => `$${(value as number).toLocaleString('es-AR')}`}
                                labelFormatter={(label) => format(new Date(label), "eeee, d 'de' MMMM", { locale: es })}
                            />} 
                        />
                        <Legend />
                        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Ventas por Categoría</CardTitle>
                <CardDescription>Distribución de ingresos por categoría de producto.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                {salesByCategory.length > 0 ? (
                <ChartContainer config={pieChartConfig} className="mx-auto aspect-square min-h-[300px]">
                    <PieChart>
                    <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent
                        hideLabel
                        formatter={(value) => `$${(value as number).toLocaleString('es-AR')}`}
                        />}
                    />
                    <Pie
                        data={salesByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={2}
                    >
                        {salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Legend content={<ChartLegendContent />} />
                    </PieChart>
                </ChartContainer>
                ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos para mostrar el gráfico.
                </div>
                )}
            </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Ventas</CardTitle>
          <CardDescription>Lista de todos los productos vendidos en pedidos entregados.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length > 0 ? sales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>{format(new Date(sale.date), 'dd/MM/yyyy HH:mm', { locale: es })}</TableCell>
                    <TableCell className="font-medium">{sale.productName}</TableCell>
                    <TableCell>{sale.category}</TableCell>
                    <TableCell className="text-center">{sale.quantity}</TableCell>
                    <TableCell className="text-right">${sale.totalPrice.toLocaleString('es-AR')}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Aún no hay ventas registradas. Las ventas de pedidos "Entregado" aparecerán aquí.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Pedidos Cancelados</CardTitle>
          <CardDescription>
            Lista de pedidos que fueron cancelados. Puedes reactivarlos para enviarlos de nuevo a la cocina.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancelledOrders.length > 0 ? cancelledOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}</TableCell>
                    <TableCell className="font-medium">{order.customerName}</TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside text-xs">
                        {order.items.map((item, idx) => (
                          <li key={idx}>{item.quantity}x {item.name} ({item.size})</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReopen(order.id)}
                        disabled={isPending}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reactivar
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No hay pedidos cancelados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

    </div>
  );
};
