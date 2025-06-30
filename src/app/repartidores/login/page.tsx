import { LoginForm } from "@/components/delivery/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md">
        <h1 className="text-4xl lg:text-5xl font-headline text-center mb-8 text-stone-800">
          Acceso Repartidores
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
