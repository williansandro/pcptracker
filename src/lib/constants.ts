import type { NavItem } from '@/components/layout/main-nav';
import { LayoutDashboard, Package, Factory, TrendingUp, Settings } from 'lucide-react';

export const APP_NAME = "Pcp Tracker";

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/skus', label: 'SKUs', icon: Package },
  { href: '/production-orders', label: 'Ordens de Produção', icon: Factory },
  { href: '/demand-planning', label: 'Planejamento Demanda', icon: TrendingUp },
];

export const PRODUCTION_ORDER_STATUSES: ProductionOrderStatus[] = ['Open', 'In Progress', 'Completed', 'Cancelled'];

import type { ProductionOrderStatus } from '@/types';

export const DUMMY_SKUS = [
  { id: 'sku-1', code: 'SKU001', description: 'Produto Exemplo Alpha', createdAt: new Date().toISOString() },
  { id: 'sku-2', code: 'SKU002', description: 'Produto Exemplo Beta', createdAt: new Date().toISOString() },
  { id: 'sku-3', code: 'SKU003', description: 'Componente Gamma', createdAt: new Date().toISOString() },
];

export const DUMMY_PRODUCTION_ORDERS = [
  { 
    id: 'po-1', 
    skuId: 'sku-1', 
    quantity: 100, 
    status: 'Completed' as ProductionOrderStatus, 
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    productionTime: 3600, // 1 hour in seconds
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() 
  },
  { 
    id: 'po-2', 
    skuId: 'sku-2', 
    quantity: 50, 
    status: 'In Progress' as ProductionOrderStatus, 
    startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() 
  },
  { 
    id: 'po-3', 
    skuId: 'sku-1', 
    quantity: 200, 
    status: 'Open' as ProductionOrderStatus, 
    createdAt: new Date().toISOString() 
  },
];

export const DUMMY_DEMANDS = [
  { id: 'demand-1', skuId: 'sku-1', monthYear: '2024-07', targetQuantity: 500, createdAt: new Date().toISOString() },
  { id: 'demand-2', skuId: 'sku-2', monthYear: '2024-07', targetQuantity: 250, createdAt: new Date().toISOString() },
  { id: 'demand-3', skuId: 'sku-1', monthYear: '2024-08', targetQuantity: 600, createdAt: new Date().toISOString() },
];
