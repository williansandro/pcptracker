
"use client";

import type React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar, // Import useSidebar
} from '@/components/ui/sidebar';
import { MainNav } from './main-nav';
import { SiteHeader } from './site-header';
import { APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Settings, PanelLeft, Menu as MenuIcon } from 'lucide-react'; // LogOut foi removido daqui, pois o logout está no SiteHeader
import { useAuth } from '@/contexts/auth-context';

interface AppShellInternalProps {
  children: React.ReactNode;
}

// Componente interno que usa o contexto da sidebar
function AppShellInternal({ children }: AppShellInternalProps) {
  const sidebar = useSidebar(); // Agora é chamado dentro do escopo do SidebarProvider

  return (
    <>
      <Sidebar
        side="left"
        variant="sidebar"
        collapsible="icon"
        className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      >
        <SidebarHeader className="p-4 border-b border-sidebar-border flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6 transition-all">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <h1 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden transition-opacity">
              {APP_NAME}
            </h1>
          </div>
          <SidebarTrigger className="data-[mobile=true]:hidden">
            {sidebar?.state === 'expanded' ? <PanelLeft /> : <MenuIcon />}
          </SidebarTrigger>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <MainNav />
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Settings className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden ml-2">Configurações</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen bg-background">
        <SiteHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { currentUser } = useAuth();

  // ProtectedLayout já deve garantir que currentUser exista, mas esta é uma verificação de segurança adicional.
  if (!currentUser) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppShellInternal>{children}</AppShellInternal>
    </SidebarProvider>
  );
}
