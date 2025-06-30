"use client";

import { useFormState } from "react-dom";
import { loginDriver } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { LogIn } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const initialState = {
  error: null,
};

export function LoginForm() {
  const [state, formAction] = useFormState(loginDriver, initialState as any);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: "Error de acceso",
        description: state.error,
      });
    }
  }, [state, toast]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription>Ingresa tus credenciales para ver los pedidos asignados.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required placeholder="Tu nombre" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            <LogIn className="mr-2 h-4 w-4" /> Ingresar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
