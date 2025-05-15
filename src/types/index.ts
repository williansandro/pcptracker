
export interface SKU {
  id: string;
  code: string;
  description: string;
  createdAt: string; // ISO Date String
}

export type ProductionOrderStatus = 'Aberta' | 'Em Progresso' | 'Concluída' | 'Cancelada';

export interface ProductionOrder {
  id: string;
  skuId: string;
  targetQuantity: number; // Renomeado de quantity
  producedQuantity?: number; // Nova propriedade
  status: ProductionOrderStatus;
  startTime?: string; // ISO Date String
  endTime?: string; // ISO Date String
  productionTime?: number; // em segundos
  notes?: string;
  createdAt: string; // ISO Date String
}

export interface Demand {
  id:string;
  skuId: string;
  monthYear: string; // Formato AAAA-MM (ex: "2024-07")
  targetQuantity: number;
  createdAt: string; // ISO Date String
}

// Para Análise de IA
export interface ProductionDataEntry {
  skuCode: string;
  quantityProduced: number; // Mantido como quantityProduced para o input da IA
  productionTimeMinutes: number;
}
