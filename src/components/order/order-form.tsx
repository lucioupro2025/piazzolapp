"use client";

import { useState, useMemo, useEffect, type FC } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

import type { MenuItem, DeliveryPerson, CartItem, Category } from '@/lib/types';
import { createOrder } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from '@/components/ui/separator';

import { Search, ShoppingCart, Trash2, Clock, User, Phone, MapPin, Send, PlusCircle, MinusCircle } from 'lucide-react';

const orderSchema = z.object({
  customerName: z.string().min(1, 'El nombre es requerido'),
  customerPhone: z.string().min(1, 'El teléfono es requerido'),
  deliveryType: z.enum(['retiro', 'envio']),
  address: z.string().optional(),
  delay: z.coerce.number().min(0, 'La demora no puede ser negativa'),
  deliveryPersonId: z.string().optional(),
}).refine(data => data.deliveryType === 'envio' ? !!data.address && data.address.length > 0 : true, {
  message: 'La dirección es requerida para envíos',
  path: ['address'],
}).refine(data => data.deliveryType === 'envio' ? !!data.deliveryPersonId : true, {
  message: 'El repartidor es requerido para envíos',
  path: ['deliveryPersonId'],
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  menu: MenuItem[];
  deliveryPeople: DeliveryPerson[];
  categories: Category[];
}

const formatSize = (size: string) => {
    switch(size) {
        case 'entera': return 'Entera';
        case 'media': return 'Media';
        case '12': return 'Docena';
        case '6': return 'Media Docena';
        case 'unidad': return 'Unidad';
        default: return size;
    }
}

export const OrderForm: FC<OrderFormProps> = ({ menu, deliveryPeople, categories }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string>('');

  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      delay: 40,
      deliveryType: 'envio',
    },
  });

  const deliveryType = watch('deliveryType');
  const delay = watch('delay');

  const filteredMenu = useMemo(() => {
    if (!searchTerm) return [];
    return menu.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) && item.available
    );
  }, [searchTerm, menu]);

  const totalAmount = useMemo(() => {
    return cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  }, [cart]);

  useEffect(() => {
    const numericDelay = parseInt(String(delay), 10);
    if (!Number.isInteger(numericDelay) || numericDelay < 0) {
        setEstimatedTime('N/A');
        return;
    }
    const date = new Date();
    date.setMinutes(date.getMinutes() + numericDelay);
    setEstimatedTime(date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
  }, [delay]);
  
  const handleAddItem = (item: MenuItem) => {
    const category = categories.find(c => c.name === item.category);
    
    if (category?.hasMultipleSizes) {
      setSelectedItem(item);
      setIsSizeModalOpen(true);
      setSearchTerm('');
    } else {
      const size = item.measurementUnit || 'unidad';
      const newItem: CartItem = {
        id: `${item.id}-${size}-${Date.now()}`,
        menuItemId: item.id,
        name: item.name,
        size: size,
        quantity: 1,
        unitPrice: item.priceFull,
      };
      const existingItem = cart.find(cartItem => cartItem.menuItemId === item.id && cartItem.size === size);
      if (existingItem) {
        updateQuantity(existingItem.id, existingItem.quantity + 1);
      } else {
        setCart(prevCart => [...prevCart, newItem]);
      }
      setSearchTerm('');
    }
  };
  
  const handleSelectSize = (size: string) => {
    if (!selectedItem) return;

    let unitPrice;
    if (size === 'entera' || size === '12') {
        unitPrice = selectedItem.priceFull;
    } else {
        unitPrice = selectedItem.priceHalf || 0;
    }

    const newItem: CartItem = {
      id: `${selectedItem.id}-${size}-${Date.now()}`,
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      size: size,
      quantity: 1,
      unitPrice: unitPrice,
    };

    const existingItem = cart.find(cartItem => cartItem.menuItemId === selectedItem.id && cartItem.size === size);
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      setCart(prevCart => [...prevCart, newItem]);
    }
    
    setIsSizeModalOpen(false);
    setSelectedItem(null);
  };
  
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
    }
  };

  const removeItem = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const processSubmit = async (data: OrderFormData) => {
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error en el pedido',
        description: 'El carrito está vacío. Agregue al menos un producto.',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createOrder({ ...data, cart, totalAmount, estimatedTime });
      toast({
        title: 'Pedido Creado',
        description: 'El pedido se ha enviado a la cocina.',
      });
      setCart([]);
      reset({ delay: 40, deliveryType: 'envio' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el pedido.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <form onSubmit={handleSubmit(processSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Search Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <Search className="h-6 w-6" /> Buscar Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  placeholder="Escriba el nombre del producto..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="text-lg"
                />
                {filteredMenu.length > 0 && (
                  <Card className="absolute z-10 w-full mt-2 shadow-xl">
                    <ScrollArea className="h-auto max-h-72">
                      <CardContent className="p-2">
                        {filteredMenu.map(item => (
                          <div
                            key={item.id}
                            onClick={() => handleAddItem(item)}
                            className="flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-accent/50"
                          >
                            <div>
                              <p className="font-bold">{item.name}</p>
                              <p className="text-sm text-muted-foreground">{item.ingredients}</p>
                            </div>
                            <span className="font-semibold text-primary">
                              ${item.priceFull}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </ScrollArea>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Details Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <User className="h-6 w-6" /> Detalles del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nombre</Label>
                  <Input id="customerName" {...register('customerName')} />
                  {errors.customerName && <p className="text-sm text-destructive">{errors.customerName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Teléfono</Label>
                  <Input id="customerPhone" type="tel" {...register('customerPhone')} />
                  {errors.customerPhone && <p className="text-sm text-destructive">{errors.customerPhone.message}</p>}
                </div>
              </div>
              <Controller
                name="deliveryType"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center gap-8 pt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="retiro" id="retiro" />
                      <Label htmlFor="retiro" className="text-base">Retiro en local</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="envio" id="envio" />
                      <Label htmlFor="envio" className="text-base">Envío a domicilio</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {deliveryType === 'envio' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="text-muted-foreground" />
                      <Input id="address" {...register('address')} placeholder="Ej: Av. Rivadavia 1234, CABA" />
                    </div>
                    {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryPersonId">Repartidor</Label>
                    <Controller
                        name="deliveryPersonId"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar repartidor..." /></SelectTrigger>
                            <SelectContent>
                            {deliveryPeople.map(person => (
                                <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        )}
                    />
                    {errors.deliveryPersonId && <p className="text-sm text-destructive">{errors.deliveryPersonId.message}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column for Cart and Summary */}
        <div className="space-y-8">
          <Card className="shadow-lg sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center justify-between font-headline text-2xl">
                <span><ShoppingCart className="inline h-6 w-6 mr-2" /> Carrito</span>
                <span className="text-3xl font-body font-bold text-primary">${totalAmount.toLocaleString('es-AR')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-auto max-h-[30vh] pr-4">
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">El carrito está vacío</p>
                ) : (
                  <ul className="space-y-4">
                    <AnimatePresence>
                      {cart.map(item => (
                        <motion.li 
                          key={item.id} 
                          layout
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-start justify-between"
                        >
                          <div>
                            <p className="font-bold">{item.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{formatSize(item.size)} - ${item.unitPrice.toLocaleString('es-AR')}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                              <span className="w-4 text-center">{item.quantity}</span>
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                            </div>
                          </div>
                          <div className='text-right'>
                            <p className="font-bold">${(item.unitPrice * item.quantity).toLocaleString('es-AR')}</p>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </ScrollArea>
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="delay" className="flex-1">Demora (minutos)</Label>
                  <Input id="delay" type="number" className="w-24" {...register('delay')} />
                </div>
                {errors.delay && <p className="text-sm text-destructive">{errors.delay.message}</p>}

                <div className="flex justify-between items-center bg-accent/30 p-3 rounded-lg">
                  <p className="font-bold">Hora de entrega estimada:</p>
                  <p className="text-xl font-bold font-body text-primary">{estimatedTime}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" size="lg" className="w-full text-lg" disabled={isSubmitting}>
                <Send className="mr-2 h-5 w-5" />
                {isSubmitting ? 'Enviando...' : 'Enviar Pedido'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
      
      {/* Size Selection Modal */}
      <Dialog open={isSizeModalOpen} onOpenChange={setIsSizeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Seleccionar tamaño para {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex justify-around">
            {selectedItem?.category === 'Pizza' && (
              <>
                <Button size="lg" onClick={() => handleSelectSize('entera')}>Entera - ${selectedItem.priceFull.toLocaleString('es-AR')}</Button>
                {selectedItem.priceHalf && selectedItem.priceHalf > 0 && <Button size="lg" variant="outline" onClick={() => handleSelectSize('media')}>Media - ${selectedItem.priceHalf.toLocaleString('es-AR')}</Button>}
              </>
            )}
            {selectedItem?.category === 'Empanada' && (
              <>
                <Button size="lg" onClick={() => handleSelectSize('12')}>Docena - ${selectedItem.priceFull.toLocaleString('es-AR')}</Button>
                {selectedItem.priceHalf && selectedItem.priceHalf > 0 && <Button size="lg" variant="outline" onClick={() => handleSelectSize('6')}>Media Docena - ${selectedItem.priceHalf.toLocaleString('es-AR')}</Button>}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSizeModalOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
