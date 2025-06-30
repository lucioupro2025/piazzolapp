"use client";

import { useState, useTransition, useMemo, type FC } from 'react';
import { useRouter } from 'next/navigation';
import type { MenuItem, DeliveryPerson, Category } from '@/lib/types';
import { 
  upsertMenuItem, deleteMenuItem, 
  upsertDeliveryPerson, deleteDeliveryPerson, 
  upsertCategory, deleteCategory
} from '@/lib/actions';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2, Check, X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface AdminDashboardProps {
  menuItems: MenuItem[];
  deliveryPeople: DeliveryPerson[];
  categories: Category[];
}

type DialogType = 'product' | 'person' | 'category' | null;

export function AdminDashboard({ menuItems, deliveryPeople, categories }: AdminDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('products');

  const [dialogState, setDialogState] = useState<{
    type: DialogType;
    data: MenuItem | DeliveryPerson | Category | null;
  }>({ type: null, data: null });

  const [deleteState, setDeleteState] = useState<{
    type: DialogType;
    id: string | null;
  }>({ type: null, id: null });


  const handleFormSubmit = (action: (formData: FormData) => Promise<void>, formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData);
        setDialogState({ type: null, data: null });
        toast({
          title: "Éxito",
          description: "Los datos se han guardado correctamente.",
        });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar la información."
        })
      }
    });
  };

  const handleDelete = () => {
    if (!deleteState.type || !deleteState.id) return;

    let action;
    switch (deleteState.type) {
        case 'product': action = deleteMenuItem(deleteState.id); break;
        case 'person': action = deleteDeliveryPerson(deleteState.id); break;
        case 'category': action = deleteCategory(deleteState.id); break;
        default: return;
    }
    
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
  
  const getButtonForTab = (tab: string) => {
    switch (tab) {
        case 'products':
            return <Button onClick={() => setDialogState({ type: 'product', data: null })}><PlusCircle className="mr-2" /> Añadir Producto</Button>;
        case 'deliveryPeople':
            return <Button onClick={() => setDialogState({ type: 'person', data: null })}><PlusCircle className="mr-2" /> Añadir Repartidor</Button>;
        case 'categories':
            return <Button onClick={() => setDialogState({ type: 'category', data: null })}><PlusCircle className="mr-2" /> Añadir Categoría</Button>;
        default:
            return null;
    }
  }

  return (
    <>
      <Tabs defaultValue="products" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
            <TabsList>
                <TabsTrigger value="products">Productos</TabsTrigger>
                <TabsTrigger value="categories">Categorías</TabsTrigger>
                <TabsTrigger value="deliveryPeople">Repartidores</TabsTrigger>
            </TabsList>
            {getButtonForTab(activeTab)}
        </div>
        <TabsContent value="products">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Pr. Principal</TableHead>
                  <TableHead>Pr. Secundario</TableHead>
                  <TableHead>Pr. Unidad</TableHead>
                  <TableHead>Disponibilidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>${item.priceFull}</TableCell>
                    <TableCell>{item.priceHalf ? `$${item.priceHalf}` : '-'}</TableCell>
                    <TableCell>{item.priceUnit ? `$${item.priceUnit}` : '-'}</TableCell>
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
        <TabsContent value="categories">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tiene Múltiples Tamaños</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>{cat.hasMultipleSizes ? <Check className="text-green-500"/> : <X className="text-red-500"/>}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDialogState({ type: 'category', data: cat })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteState({ type: 'category', id: cat.id })}>
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
      
      <Dialog open={dialogState.type === 'product'} onOpenChange={(open) => !open && setDialogState({ type: null, data: null})}>
        <DialogContent className="max-w-3xl">
            <ProductForm
                key={(dialogState.data as MenuItem)?.id || 'new'}
                item={dialogState.data as MenuItem | null}
                categories={categories}
                isPending={isPending}
                onSubmit={(formData) => handleFormSubmit(upsertMenuItem, formData)}
                onClose={() => setDialogState({ type: null, data: null })}
            />
        </DialogContent>
      </Dialog>
      
      {/* Person Dialog */}
      <Dialog open={dialogState.type === 'person'} onOpenChange={(open) => !open && setDialogState({ type: null, data: null})}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{dialogState.data ? 'Editar' : 'Añadir'} Repartidor</DialogTitle>
                <DialogDescription>Completa los datos del repartidor. La contraseña es obligatoria para nuevos repartidores.</DialogDescription>
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
                        <Input id="password" name="password" type="password" placeholder={dialogState.data ? 'Dejar en blanco para no cambiar' : ''} required={!dialogState.data} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={dialogState.type === 'category'} onOpenChange={(open) => !open && setDialogState({ type: null, data: null})}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{dialogState.data ? 'Editar' : 'Añadir'} Categoría</DialogTitle>
                <DialogDescription>Crea o edita una categoría para tus productos.</DialogDescription>
            </DialogHeader>
            <form action={(formData) => handleFormSubmit(upsertCategory, formData)}>
                 {dialogState.data && <input type="hidden" name="id" value={(dialogState.data as Category).id} />}
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" name="name" defaultValue={(dialogState.data as Category)?.name} required />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="hasMultipleSizes" name="hasMultipleSizes" defaultChecked={(dialogState.data as Category)?.hasMultipleSizes ?? false} />
                        <Label htmlFor="hasMultipleSizes">Tiene múltiples tamaños (ej: Pizza Entera/Media)</Label>
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

interface ProductFormProps {
    item: MenuItem | null;
    categories: Category[];
    isPending: boolean;
    onSubmit: (formData: FormData) => void;
    onClose: () => void;
}

function ProductForm({ item, categories, isPending, onSubmit, onClose }: ProductFormProps) {
    const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>(item?.category);

    const selectedCategory = useMemo(() => {
        return categories.find(c => c.name === selectedCategoryName);
    }, [selectedCategoryName, categories]);

    const categoryHasMultipleSizes = selectedCategory?.hasMultipleSizes ?? false;
    const categoryIsPizza = selectedCategory?.name === 'Pizza';
    const categoryIsEmpanada = selectedCategory?.name === 'Empanada';

    return (
        <>
            <DialogHeader>
                <DialogTitle>{item ? 'Editar' : 'Añadir'} Producto</DialogTitle>
                <DialogDescription>
                    Completa la información del producto. Los campos se habilitarán según la categoría seleccionada.
                </DialogDescription>
            </DialogHeader>
            <form action={onSubmit}>
                {item && <input type="hidden" name="id" value={item.id} />}
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" name="name" defaultValue={item?.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ingredients">Ingredientes/Descripción</Label>
                        <Textarea id="ingredients" name="ingredients" defaultValue={item?.ingredients} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Select name="category" value={selectedCategoryName} onValueChange={setSelectedCategoryName} required>
                            <SelectTrigger id="category"><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priceFull">
                                {categoryIsPizza ? 'Precio Entera' : categoryIsEmpanada ? 'Precio Docena' : 'Precio'}
                            </Label>
                            <Input id="priceFull" name="priceFull" type="number" step="0.01" defaultValue={item?.priceFull} required disabled={!selectedCategoryName} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priceHalf">
                                {categoryIsPizza ? 'Precio Media' : categoryIsEmpanada ? 'Precio 1/2 Doc.' : ''}
                            </Label>
                            <Input 
                                id="priceHalf" 
                                name="priceHalf" 
                                type="number" 
                                step="0.01" 
                                defaultValue={item?.priceHalf} 
                                disabled={!selectedCategoryName || !categoryHasMultipleSizes}
                                placeholder={!categoryHasMultipleSizes ? 'No aplica' : ''}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="priceUnit">Precio Unidad</Label>
                            <Input 
                                id="priceUnit" 
                                name="priceUnit" 
                                type="number" 
                                step="0.01" 
                                defaultValue={item?.priceUnit} 
                                disabled={!categoryIsEmpanada}
                                placeholder={!categoryIsEmpanada ? 'No aplica' : ''}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="measurementUnit">Unidad de Medida</Label>
                        <Input 
                            id="measurementUnit" 
                            name="measurementUnit" 
                            defaultValue={item?.measurementUnit} 
                            placeholder="Ej: 1.5L, porción, 500g"
                            disabled={!selectedCategoryName || categoryHasMultipleSizes}
                        />
                        <p className="text-xs text-muted-foreground">
                            {categoryHasMultipleSizes
                                ? 'Para Pizzas o Empanadas, las medidas son automáticas y este campo se deshabilita.' 
                                : 'Para ítems como bebidas o postres, especifique la medida aquí.'}
                        </p>
                    </div>
                   
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch id="available" name="available" defaultChecked={item?.available ?? true} />
                        <Label htmlFor="available">Disponible</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</Button>
                </DialogFooter>
            </form>
        </>
    );
}


const Card: FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="border rounded-lg overflow-hidden">{children}</div>
)
