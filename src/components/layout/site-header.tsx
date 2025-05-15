
import { APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Menu, Search, SlidersHorizontal, Bell, Settings } from 'lucide-react';
import { MainNav } from './main-nav';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card supports-[backdrop-filter]:bg-card/80 backdrop-blur">
      <div className="container flex h-16 items-center px-4 md:px-6">
        {/* App Name for Desktop (now part of sidebar trigger) - this part removed as sidebar contains name */}
        {/* <div className="mr-4 hidden md:flex">
          <span className="font-bold text-lg">{APP_NAME}</span>
        </div> */}

        {/* Mobile Menu & App Name */}
        <div className="flex items-center md:hidden">
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 pt-6 bg-sidebar text-sidebar-foreground">
               <div className="px-4 pb-4 mb-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-primary">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                  <span className="font-semibold text-lg text-primary">{APP_NAME}</span>
                 </div>
               </div>
              <MainNav />
            </SheetContent>
          </Sheet>
          {/* App Name on mobile, next to hamburger */}
           <div className="flex items-center gap-2 md:hidden">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            <span className="font-semibold text-lg text-primary">{APP_NAME}</span>
          </div>
        </div>
        
        {/* Search Bar - Hidden on mobile, shown on md+ */}
        <div className="hidden md:flex flex-1 items-center justify-center px-4 lg:px-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar..."
              className="h-9 w-full rounded-md bg-background pl-10 pr-4 border-border focus:border-primary"
            />
            {/* Placeholder for filter button next to search bar */}
            {/* <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button> */}
          </div>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Placeholder Action Icons */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            <span className="sr-only">Notificações</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            <span className="sr-only">Configurações</span>
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://placehold.co/40x40.png" alt="Usuário" data-ai-hint="user avatar" />
            <AvatarFallback>PCP</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
