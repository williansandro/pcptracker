
"use client";

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell'; // AppShell é usado aqui

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !currentUser && pathname !== '/login') {
      router.push('/login');
    }
  }, [currentUser, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Se não estiver autenticado E estiver na página de login, renderiza a página de login (children) diretamente
  if (!currentUser && pathname === '/login') {
    return <>{children}</>;
  }

  // Se não estiver autenticado E NÃO estiver na página de login (deve ter sido pego pelo redirect, mas como fallback)
  if (!currentUser) {
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  // Se estiver autenticado, renderiza AppShell com o conteúdo da página (children)
  // O AppShell internamente verificará currentUser novamente, mas neste ponto, ele deve existir.
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
