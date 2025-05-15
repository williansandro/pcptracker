import { APP_NAME } from '@/lib/constants';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { MainNav } from './main-nav';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          {/* <SidebarTrigger className="hidden lg:flex" /> */}
          <span className="font-bold text-lg">{APP_NAME}</span>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center">
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0 pt-6 bg-sidebar text-sidebar-foreground">
               <div className="px-4 pb-4 mb-4 border-b border-sidebar-border">
                 <span className="font-bold text-lg">{APP_NAME}</span>
               </div>
              <MainNav />
            </SheetContent>
          </Sheet>
          <span className="ml-2 font-bold text-lg">{APP_NAME}</span>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Add User Profile Dropdown or Theme Toggle here if needed */}
        </div>
      </div>
    </header>
  );
}
