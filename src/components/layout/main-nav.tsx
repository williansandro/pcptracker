
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
// Tooltip not explicitly used here anymore if handled by SidebarMenuButton prop

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {NAV_ITEMS.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
              disabled={item.disabled}
              aria-disabled={item.disabled}
              className={cn(
                "w-full justify-start",
                // Custom active styles to match Berry (light purple background, purple text)
                // These are now primarily driven by --sidebar-accent and --sidebar-accent-foreground
                // defined in globals.css and applied by the SidebarMenuButton's data-[active=true] state
              )}
              tooltip={{ children: item.label, side: 'right', align: 'center' }}
            >
              <a>
                <item.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
