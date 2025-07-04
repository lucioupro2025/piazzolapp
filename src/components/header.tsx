"use client";

import Link from 'next/link';
import { Button } from './ui/button';
import { Pizza, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export function Header() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const isRepartidoresPath = pathname.startsWith('/repartidores');

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setSheetOpen(false)}>
          <Pizza className="h-8 w-8 text-primary" />
          <span className="text-3xl font-bold font-headline text-primary">PIAZZOLApp</span>
        </Link>
        
        {!isRepartidoresPath && (
            <>
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-2">
                    <Button variant="ghost" asChild className="text-base">
                        <Link href="/">Tomar Pedido</Link>
                    </Button>
                    <Button variant="ghost" asChild className="text-base">
                        <Link href="/cocina">Cocina</Link>
                    </Button>
                    <Button variant="ghost" asChild className="text-base">
                        <Link href="/repartidores">Repartidores</Link>
                    </Button>
                    <Button variant="ghost" asChild className="text-base">
                        <Link href="/estadisticas">Estadísticas</Link>
                    </Button>
                    <Button variant="ghost" asChild className="text-base">
                        <Link href="/admin">Administración</Link>
                    </Button>
                </nav>

                {/* Mobile Navigation */}
                <div className="md:hidden">
                    <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                        <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle>Menú</SheetTitle>
                            <SheetDescription>
                            Navegue por las secciones de la aplicación.
                            </SheetDescription>
                        </SheetHeader>
                        <nav className="flex flex-col gap-4 mt-8">
                            <Button variant="ghost" asChild className="text-lg justify-start" onClick={() => setSheetOpen(false)}>
                            <Link href="/">Tomar Pedido</Link>
                            </Button>
                            <Button variant="ghost" asChild className="text-lg justify-start" onClick={() => setSheetOpen(false)}>
                            <Link href="/cocina">Cocina</Link>
                            </Button>
                            <Button variant="ghost" asChild className="text-lg justify-start" onClick={() => setSheetOpen(false)}>
                            <Link href="/repartidores">Repartidores</Link>
                            </Button>
                            <Button variant="ghost" asChild className="text-lg justify-start" onClick={() => setSheetOpen(false)}>
                            <Link href="/estadisticas">Estadísticas</Link>
                            </Button>
                            <Button variant="ghost" asChild className="text-lg justify-start" onClick={() => setSheetOpen(false)}>
                            <Link href="/admin">Administración</Link>
                            </Button>
                        </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </>
        )}
      </div>
    </header>
  );
}
