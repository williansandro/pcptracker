
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, LogIn } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const loginFormSchema = z.object({
  email: z.string().email("Formato de e-mail inválido.").min(1, "E-mail é obrigatório."),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres.").min(1, "Senha é obrigatória."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { login, currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!authLoading && currentUser) {
      router.push('/'); // Redireciona para o painel se já estiver logado
    }
  }, [currentUser, authLoading, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      // O redirecionamento pós-login é tratado pelo ProtectedLayout ou useEffect acima
      // Se chegar aqui, o login foi bem-sucedido e o onAuthStateChanged já deve ter atualizado currentUser
    } catch (error) {
      // O erro já é tratado e exibido como toast no AuthContext
      // Não é necessário exibir outro toast aqui
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Se já estiver logado (e não carregando), e o useEffect ainda não redirecionou,
  // não renderizar o formulário de login para evitar piscar.
  // O redirecionamento deve ocorrer pelo useEffect ou ProtectedLayout.
  if (currentUser) {
     return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Redirecionando...</p>
        <Loader2 className="ml-2 h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
           <div className="flex items-center justify-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-primary">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>
            <h1 className="text-3xl font-bold text-primary">{APP_NAME}</h1>
           </div>
          <CardTitle className="text-2xl">Acessar Plataforma</CardTitle>
          <CardDescription>
            Bem-vindo! Por favor, insira suas credenciais para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Sua senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
       <p className="mt-8 text-center text-xs text-muted-foreground">
        Ainda não tem uma conta? Entre em contato com o administrador.
      </p>
    </div>
  );
}
