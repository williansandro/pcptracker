
export interface SKU {
  id: string;
  code: string;
  description: string;
  createdAt: string; // ISO Date String
}

export type ProductionOrderStatus = 'Aberta' | 'Em Progresso' | 'Concluída' | 'Cancelada';

export interface BreakEntry {
  id: string; // uuid
  description: string;
  durationMinutes: number;
}

export interface ProductionOrder {
  id: string;
  skuId: string;
  targetQuantity: number;
  producedQuantity?: number;
  status: ProductionOrderStatus;
  startTime?: string | null; // ISO Date String
  endTime?: string | null; // ISO Date String
  productionTime?: number | null; // em segundos, líquido (já descontadas as pausas)
  notes?: string;
  breaks?: BreakEntry[]; // Lista de pausas
  createdAt: string; // ISO Date String
}

export interface Demand {
  id:string;
  skuId: string;
  monthYear: string; // Formato AAAA-MM (ex: "2024-07")
  targetQuantity: number;
  createdAt: string; // ISO Date String
}

// Para Análise de IA de Produção
export interface ProductionDataEntry {
  skuCode: string;
  quantityProduced: number;
  productionTimeMinutes: number;
}

// Para Análise de IA de Demanda
export interface DemandDataEntry {
  skuCode: string;
  skuDescription: string;
  monthYear: string;
  targetQuantity: number;
  producedQuantity: number;
}

export type AnalyzeDemandForecastOutput = {
  analysis: string;
  suggestions: string;
};

export type AnalyzeDemandForecastInput = {
  skuCode: string;
  skuDescription: string;
  historicalData: {
    monthYear: string;
    targetQuantity: number;
    producedQuantity: number;
  }[];
};
