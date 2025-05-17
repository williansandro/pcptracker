
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppContextProvider } from '@/contexts/app-context';
import { AuthContextProvider } from '@/contexts/auth-context'; // Adicionado
import { ProtectedLayout } from '@/components/layout/protected-layout'; // Adicionado
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME } from '@/lib/constants';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Controle e Planejamento da Produção',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <AuthContextProvider>
          <AppContextProvider>
            <ProtectedLayout>
              <AppShell>
                {children}
              </AppShell>
              <Toaster />
            </ProtectedLayout>
          </AppContextProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
