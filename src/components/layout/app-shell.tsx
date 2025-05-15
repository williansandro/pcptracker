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
} from '@/components/ui/sidebar';
import { MainNav } from './main-nav';
import { SiteHeader } from './site-header';
import { APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Settings, LogOut } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // The sidebar state is persisted in a cookie by default by the SidebarProvider
  // defaultOpen can be set to false if you prefer it collapsed initially
  return (
    <SidebarProvider defaultOpen={true} open={true} >
      <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r">
        <SidebarHeader className="p-4 border-b border-sidebar-border items-center">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <h1 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
              {APP_NAME}
            </h1>
          </div>
          {/* <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:hidden" /> */}
        </SidebarHeader>
        <SidebarContent className="p-2">
          <MainNav />
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
           {/* Placeholder for user settings or logout */}
           <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center">
            <Settings className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden ml-2">Configurações</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
