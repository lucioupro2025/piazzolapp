"use client";

import { useState, useTransition, type FC } from 'react';
import { useRouter } from 'next/navigation';
import type { MenuItem, DeliveryPerson } from '@/lib/types';
import { upsertMenuItem, deleteMenuItem, upsertDeliveryPerson, deleteDeliveryPerson } from '@/lib/actions';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface AdminDashboardProps {
  menuItems: MenuItem[];
  deliveryPeople: DeliveryPerson[];
}

export function AdminDashboard({ menuItems, deliveryPeople }: AdminDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const [dialogState, setDialogState] = useState<{
    type: 'product' | 'person' | null;
    data: MenuItem | DeliveryPerson | null;
  }>({ type: null, data: null });

  const [deleteState, setDeleteState] = useState<{
    type: 'product' | 'person' | null;
    id: string | null;
  }>({ type: null, id: null });


  const handleFormSubmit = (action: (formData: FormData) => Promise<void>, formData: FormData) => {
    startTransition(async () => {
      await action(formData);
      setDialogState({ type: null, data: null });
      toast({
        title: "Éxito",
        description: "Los datos se han guardado correctamente.",
      });
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteState.type || !deleteState.id) return;

    const action = deleteState.type === 'product' ? deleteMenuItem(deleteState.id) : deleteDeliveryPerson(deleteState.id);
    
    startTransition(async () => {
        await action;
        setDeleteState({ type: null, id: null });
        toast({
            title: "Eliminado",
            description: "El registro ha sido eliminado.",
        });
        router.refresh();
    });
  };
  
  return (
    <>
      <Tabs defaultValue="products">
        <div className="flex justify-between items-center mb-4">
            <TabsList>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="deliveryPeople">Repartidores</TabsTrigger>
            </TabsList>
            <Button onClick={() => setDialogState({ type: 'product', data: null })}>
                <PlusCircle className="mr-2" /> Añadir Producto
            </Button>
        </div>
        <TabsContent value="products">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio (Entera/Media)</TableHead>
                  <TableHead>Disponibilidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>${item.priceFull} / ${item.priceHalf}</TableCell>
                    <TableCell>
                        <Badge variant={item.available ? "default" : "destructive"} className={cn(item.available ? 'bg-green-500' : 'bg-red-500', 'text-white')}>
                            {item.available ? 'Sí' : 'No'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDialogState({ type: 'product', data: item })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteState({ type: 'product', id: item.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="deliveryPeople">
        <div className="flex justify-end mb-4">
            <Button onClick={() => setDialogState({ type: 'person', data: null })}>
                <PlusCircle className="mr-2" /> Añadir Repartidor
            </Button>
        </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryPeople.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDialogState({ type: 'person', data: person })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteState({ type: 'person', id: person.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Product Dialog */}
      <Dialog open={dialogState.type === 'product'} onOpenChange={(open) => !open && setDialogState({ type: null, data: null})}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{dialogState.data ? 'Editar' : 'Añadir'} Producto</DialogTitle>
            </DialogHeader>
            <form action={(formData) => handleFormSubmit(upsertMenuItem, formData)}>
                {dialogState.data && <input type="hidden" name="id" value={(dialogState.data as MenuItem).id} />}
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" name="name" defaultValue={(dialogState.data as MenuItem)?.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ingredients">Ingredientes</Label>
                        <Textarea id="ingredients" name="ingredients" defaultValue={(dialogState.data as MenuItem)?.ingredients} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Select name="category" defaultValue={(dialogState.data as MenuItem)?.category} required>
                            <SelectTrigger id="category"><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pizza">Pizza</SelectItem>
                                <SelectItem value="Empanada">Empanada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priceFull">Precio Entera/Docena</Label>
                            <Input id="priceFull" name="priceFull" type="number" step="0.01" defaultValue={(dialogState.data as MenuItem)?.priceFull} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priceHalf">Precio Media/Media Docena</Label>
                            <Input id="priceHalf" name="priceHalf" type="number" step="0.01" defaultValue={(dialogState.data as MenuItem)?.priceHalf} required />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="available" name="available" defaultChecked={(dialogState.data as MenuItem)?.available ?? true} />
                        <Label htmlFor="available">Disponible</Label>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      {/* Person Dialog */}
      <Dialog open={dialogState.type === 'person'} onOpenChange={(open) => !open && setDialogState({ type: null, data: null})}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{dialogState.data ? 'Editar' : 'Añadir'} Repartidor</DialogTitle>
            </DialogHeader>
            <form action={(formData) => handleFormSubmit(upsertDeliveryPerson, formData)}>
                 {dialogState.data && <input type="hidden" name="id" value={(dialogState.data as DeliveryPerson).id} />}
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" name="name" defaultValue={(dialogState.data as DeliveryPerson)?.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input id="password" name="password" type="password" defaultValue={(dialogState.data as DeliveryPerson)?.password} required />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteState.id} onOpenChange={(open) => !open && setDeleteState({ type: null, id: null })}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente el registro.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                    {isPending ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const Card: FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="border rounded-lg overflow-hidden">{children}</div>
)
