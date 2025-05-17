
"use client";

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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

  if (!currentUser && pathname !== '/login') {
    // Ainda pode estar no processo de redirecionamento pelo useEffect
    // ou pode ser o render inicial antes do useEffect executar.
    // Mostrar um loader para evitar piscar o conteúdo indevido.
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  // Se estiver na página de login e já autenticado, o useEffect em login/page.tsx deve redirecionar.
  // Se não estiver autenticado, a página de login será renderizada (se for a rota /login).
  // Se estiver autenticado e não for /login, renderiza os children.
  return <>{children}</>;
}
