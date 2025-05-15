
import type { NavItem } from '@/components/layout/main-nav';
import { LayoutDashboard, Package, Factory, TrendingUp } from 'lucide-react';
import type { SKU, ProductionOrder, Demand, ProductionOrderStatus } from '@/types';

export const APP_NAME = "PCP Tracker"; // PCP: Planejamento e Controle da Produção

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Painel Principal', icon: LayoutDashboard },
  { href: '/skus', label: 'SKUs', icon: Package },
  { href: '/production-orders', label: 'Ordens de Produção', icon: Factory },
  { href: '/demand-planning', label: 'Planejamento Demanda', icon: TrendingUp },
];

export const PRODUCTION_ORDER_STATUSES: ProductionOrderStatus[] = ['Aberta', 'Em Progresso', 'Concluída', 'Cancelada'];


// Dados Fictícios (Dummy Data) para inicialização e testes
const now = new Date();
const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

export const DUMMY_SKUS_DATA: Omit<SKU, 'id' | 'createdAt'>[] = [
  { code: 'SKU-CANAZ-G', description: 'Caneta Azul Gel Ponta Grossa'},
  { code: 'SKU-CADBR-P', description: 'Caderno Brochura Capa Dura Pequeno'},
  { code: 'SKU-LAPHB-U', description: 'Lápis HB Preto Unitário'},
  { code: 'SKU-BORBR-M', description: 'Borracha Branca Macia Média'},
  { code: 'SKU-RGU30-T', description: 'Régua 30cm Transparente Acrílico'},
];

export const DUMMY_PRODUCTION_ORDERS_DATA: Omit<ProductionOrder, 'id' | 'createdAt' | 'status' | 'skuId'>[] = [
  {
    targetQuantity: 100,
    producedQuantity: 95, // Exemplo: produziu um pouco menos
    startTime: twoHoursAgo,
    endTime: oneHourAgo,
    productionTime: 3600,
    notes: "Primeiro lote de canetas azuis."
  },
  {
    targetQuantity: 50,
    // producedQuantity será definido quando for concluída
    startTime: thirtyMinAgo,
    notes: "Produção de cadernos em andamento."
  },
  {
    targetQuantity: 200,
    notes: "Pedido urgente de canetas."
  },
  {
    targetQuantity: 150,
  },
  {
    targetQuantity: 75,
    producedQuantity: 80, // Exemplo: produziu um pouco mais
    startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() - 3 * 30 * 60 * 1000).toISOString(),
    productionTime: 1800,
    notes: "Lote de borrachas finalizado."
  }
];

export const DUMMY_DEMANDS_DATA: Omit<Demand, 'id' | 'createdAt' | 'skuId'>[] = [
  { monthYear: '2024-07', targetQuantity: 500 },
  { monthYear: '2024-07', targetQuantity: 250 },
  { monthYear: '2024-08', targetQuantity: 600 },
  { monthYear: '2024-08', targetQuantity: 300 },
  { monthYear: '2024-09', targetQuantity: 400 },
];

// Chaves para localStorage
export const LOCAL_STORAGE_SKUS_KEY = 'pcpTrackerSkus';
export const LOCAL_STORAGE_PRODUCTION_ORDERS_KEY = 'pcpTrackerProductionOrders';
export const LOCAL_STORAGE_DEMANDS_KEY = 'pcpTrackerDemands';
