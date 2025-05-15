import type { NavItem } from '@/components/layout/main-nav';
import { LayoutDashboard, Package, Factory, TrendingUp } from 'lucide-react'; // Removido Settings, pois não há página de settings
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
const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

export const DUMMY_SKUS_DATA: Omit<SKU, 'id' | 'createdAt'>[] = [
  { code: 'SKU-CANAZ-G', description: 'Caneta Azul Gel Ponta Grossa'},
  { code: 'SKU-CADBR-P', description: 'Caderno Brochura Capa Dura Pequeno'},
  { code: 'SKU-LAPHB-U', description: 'Lápis HB Preto Unitário'},
  { code: 'SKU-BORBR-M', description: 'Borracha Branca Macia Média'},
  { code: 'SKU-RGU30-T', description: 'Régua 30cm Transparente Acrílico'},
];

export const DUMMY_PRODUCTION_ORDERS_DATA: Omit<ProductionOrder, 'id' | 'createdAt' | 'status' | 'skuId'>[] = [
  // Estes serão ligados aos SKUs por índice na inicialização do contexto
  { 
    quantity: 100, 
    // skuId will be DUMMY_SKUS_DATA[0].id
    // status: 'Concluída', // Definido no contexto
    startTime: twoHoursAgo,
    endTime: oneHourAgo,
    productionTime: 3600, // 1 hora em segundos
    notes: "Primeiro lote de canetas azuis."
  },
  { 
    quantity: 50, 
    // skuId will be DUMMY_SKUS_DATA[1].id
    // status: 'Em Progresso', // Definido no contexto
    startTime: thirtyMinAgo,
    notes: "Produção de cadernos em andamento."
  },
  { 
    quantity: 200,
    // skuId will be DUMMY_SKUS_DATA[0].id
    // status: 'Aberta', // Definido no contexto
    notes: "Pedido urgente de canetas."
  },
  {
    quantity: 150,
    // skuId will be DUMMY_SKUS_DATA[2].id
    // status: 'Aberta'
  },
  {
    quantity: 75,
    // skuId will be DUMMY_SKUS_DATA[3].id
    // status: 'Concluída'
    startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() - 3 * 30 * 60 * 1000).toISOString(),
    productionTime: 1800, // 30 minutos
    notes: "Lote de borrachas finalizado."
  }
];

export const DUMMY_DEMANDS_DATA: Omit<Demand, 'id' | 'createdAt' | 'skuId'>[] = [
  // Estes serão ligados aos SKUs por índice na inicialização do contexto
  { monthYear: '2024-07', targetQuantity: 500 }, // skuId will be DUMMY_SKUS_DATA[0].id
  { monthYear: '2024-07', targetQuantity: 250 }, // skuId will be DUMMY_SKUS_DATA[1].id
  { monthYear: '2024-08', targetQuantity: 600 }, // skuId will be DUMMY_SKUS_DATA[0].id
  { monthYear: '2024-08', targetQuantity: 300 }, // skuId will be DUMMY_SKUS_DATA[2].id
  { monthYear: '2024-09', targetQuantity: 400 }, // skuId will be DUMMY_SKUS_DATA[1].id
];

// Chaves para localStorage
export const LOCAL_STORAGE_SKUS_KEY = 'pcpTrackerSkus';
export const LOCAL_STORAGE_PRODUCTION_ORDERS_KEY = 'pcpTrackerProductionOrders';
export const LOCAL_STORAGE_DEMANDS_KEY = 'pcpTrackerDemands';
