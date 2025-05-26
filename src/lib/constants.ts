
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
  { code: 'SKU-CANAZ-G', description: 'Caneta Azul Gel Ponta Grossa', standardTimeSeconds: 30, assemblyTimeSeconds: 5 }, // Caneta precisa de montagem da carga + tampa
  { code: 'SKU-CARGA-AZ', description: 'Carga Tinta Azul para Caneta', standardTimeSeconds: 15 }, // Componente
  { code: 'SKU-CORPO-CAN', description: 'Corpo Plástico para Caneta', standardTimeSeconds: 10 }, // Componente
  { code: 'SKU-TAMPA-CAN', description: 'Tampa Plástica para Caneta', standardTimeSeconds: 8 },   // Componente
  { code: 'SKU-CADBR-P', description: 'Caderno Brochura Capa Dura Pequeno', standardTimeSeconds: 120, assemblyTimeSeconds: 60 },
  { code: 'SKU-LAPHB-U', description: 'Lápis HB Preto Unitário', standardTimeSeconds: 20 },
  { code: 'SKU-BORBR-M', description: 'Borracha Branca Macia Média', standardTimeSeconds: 10 },
  { code: 'SKU-RGU30-T', description: 'Régua 30cm Transparente Acrílico', standardTimeSeconds: 25 },
  { 
    code: 'KIT-ESCOLAR-01', 
    description: 'Kit Escolar Básico (Caneta, Lápis, Borracha)', 
    assemblyTimeSeconds: 90, // Tempo para embalar o kit
    components: [ // Será populado com IDs reais durante o seeding
      { componentSkuId: 'ID_DA_CANETA_AZUL_GEL', quantity: 1 }, 
      { componentSkuId: 'ID_DO_LAPIS_HB', quantity: 1 },
      { componentSkuId: 'ID_DA_BORRACHA_BRANCA_M', quantity: 1 }
    ]
  },
];

export const DUMMY_PRODUCTION_ORDERS_DATA: Omit<ProductionOrder, 'id' | 'createdAt' | 'status' | 'skuId'>[] = [
  {
    targetQuantity: 100,
    producedQuantity: 95,
    startTime: twoHoursAgo,
    endTime: oneHourAgo,
    productionTime: 3540,
    notes: "Primeiro lote de canetas azuis.",
    breaks: [{ id: 'break1', description: "Pausa café", durationMinutes: 1 }]
  },
  {
    targetQuantity: 50,
    startTime: thirtyMinAgo,
    notes: "Produção de cadernos em andamento.",
    breaks: [],
  },
  {
    targetQuantity: 200,
    notes: "Pedido urgente de canetas.",
    breaks: [],
  },
  {
    targetQuantity: 150,
    breaks: [],
  },
  {
    targetQuantity: 75,
    producedQuantity: 80,
    startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() - 3 * 30 * 60 * 1000).toISOString(),
    productionTime: 1800,
    notes: "Lote de borrachas finalizado.",
    breaks: [],
  }
];

export const DUMMY_DEMANDS_DATA: Omit<Demand, 'id' | 'createdAt' | 'skuId'>[] = [
  { monthYear: '2024-07', targetQuantity: 500 },
  { monthYear: '2024-07', targetQuantity: 250 },
  { monthYear: '2024-08', targetQuantity: 600 },
  { monthYear: '2024-08', targetQuantity: 300 },
  { monthYear: '2024-09', targetQuantity: 400 },
];

// Chaves para localStorage - Não são mais usadas para dados principais, mas podem ser úteis para configurações futuras
export const LOCAL_STORAGE_SETTINGS_KEY = 'pcpTrackerSettings';
