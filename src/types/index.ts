export interface SKU {
  id: string;
  code: string;
  description: string;
  createdAt: string;
}

export type ProductionOrderStatus = 'Open' | 'In Progress' | 'Completed' | 'Cancelled';

export interface ProductionOrder {
  id: string;
  skuId: string;
  quantity: number;
  status: ProductionOrderStatus;
  startTime?: string;
  endTime?: string;
  productionTime?: number; // in seconds
  notes?: string;
  createdAt: string;
}

export interface Demand {
  id:string;
  skuId: string;
  monthYear: string; // YYYY-MM format
  targetQuantity: number;
  createdAt: string;
}

// For AI Analysis
export interface ProductionDataEntry {
  skuCode: string;
  quantityProduced: number;
  productionTimeMinutes: number;
}
