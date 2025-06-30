"use client";

import type { FC } from 'react';
import type { Sale } from '@/lib/types';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip } from "recharts";
import { ScrollArea } from '@/components/ui/scroll-area';

interface StatisticsDisplayProps {
  sales: Sale[];
}

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export const StatisticsDisplay: FC<StatisticsDisplayProps> = ({ sales }) => {

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

      <Card>
        <CardHeader>
          <CardTitle>Ventas por Día</CardTitle>
          <CardDescription>Ingresos de los últimos días con pedidos entregados.</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                 <BarChart data={salesByDay} accessibilityLayer margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => format(new Date(value), "d MMM", { locale: es })}
                    />
                    <YAxis
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
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length > 0 ? sales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>{format(new Date(sale.date), 'dd/MM/yyyy HH:mm', { locale: es })}</TableCell>
                    <TableCell className="font-medium">{sale.productName}</TableCell>
                    <TableCell className="text-center">{sale.quantity}</TableCell>
                    <TableCell className="text-right">${sale.totalPrice.toLocaleString('es-AR')}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Aún no hay ventas registradas. Las ventas de pedidos "Entregado" aparecerán aquí.
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
