import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google'; // Using Inter as a common sans-serif
import './globals.css';
import { cn } from '@/lib/utils';
import { AppContextProvider } from '@/contexts/app-context';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from "@/components/ui/toaster";

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans', // Changed from --font-geist-sans to --font-sans for consistency
});

export const metadata: Metadata = {
  title: 'Pcp Tracker',
  description: 'Production Control and Planning Tracker',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <AppContextProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster />
        </AppContextProvider>
      </body>
    </html>
  );
}
