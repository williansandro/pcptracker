
"use client";

import type React from 'react';
import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { SKU, ProductionOrder, Demand, ProductionOrderStatus } from '@/types';
import {
  DUMMY_SKUS_DATA,
  DUMMY_PRODUCTION_ORDERS_DATA,
  DUMMY_DEMANDS_DATA,
  LOCAL_STORAGE_SKUS_KEY,
  LOCAL_STORAGE_PRODUCTION_ORDERS_KEY,
  LOCAL_STORAGE_DEMANDS_KEY,
} from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

// Helper para carregar do localStorage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Erro ao carregar ${key} do localStorage:`, error);
    return defaultValue;
  }
};

// Helper para salvar no localStorage
const saveToLocalStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Erro ao salvar ${key} no localStorage:`, error);
  }
};

const initializeDummyData = (): { skus: SKU[], productionOrders: ProductionOrder[], demands: Demand[] } => {
  const initialSkus: SKU[] = DUMMY_SKUS_DATA.map(skuData => ({
    ...skuData,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }));

  const initialProductionOrders: ProductionOrder[] = DUMMY_PRODUCTION_ORDERS_DATA.map((poData, index) => {
    let status: ProductionOrderStatus = 'Aberta';
    if (index === 0) status = 'Concluída';
    else if (index === 1) status = 'Em Progresso';
    else if (index === 4) status = 'Concluída';

    return {
      id: uuidv4(),
      skuId: initialSkus[index % initialSkus.length].id,
      targetQuantity: poData.targetQuantity,
      producedQuantity: status === 'Concluída' ? poData.producedQuantity : undefined,
      status,
      startTime: poData.startTime,
      endTime: status === 'Concluída' ? poData.endTime : undefined,
      productionTime: status === 'Concluída' ? poData.productionTime : undefined,
      notes: poData.notes,
      createdAt: new Date(Date.now() - (DUMMY_PRODUCTION_ORDERS_DATA.length - index) * 10 * 60 * 1000).toISOString(),
    };
  });

  const initialDemands: Demand[] = DUMMY_DEMANDS_DATA.map((demandData, index) => ({
    ...demandData,
    id: uuidv4(),
    skuId: initialSkus[index % initialSkus.length].id,
    createdAt: new Date().toISOString(),
  }));

  return { skus: initialSkus, productionOrders: initialProductionOrders, demands: initialDemands };
};

interface DeleteSelectedSkusResult {
  deletedCount: number;
  notDeleted: { code: string; reason: string }[];
}

interface AppContextType {
  skus: SKU[];
  addSku: (skuData: Omit<SKU, 'id' | 'createdAt'>) => void;
  updateSku: (skuId: string, skuData: Partial<Omit<SKU, 'id' | 'createdAt'>>) => void;
  deleteSku: (skuId: string) => void;
  deleteSelectedSkus: (skuIds: string[]) => DeleteSelectedSkusResult;
  findSkuById: (skuId: string) => SKU | undefined;

  productionOrders: ProductionOrder[];
  addProductionOrder: (poData: Omit<ProductionOrder, 'id' | 'createdAt' | 'status' | 'producedQuantity'>) => void;
  updateProductionOrder: (poId: string, poData: Partial<Omit<ProductionOrder, 'id' | 'createdAt'>>) => void;
  deleteProductionOrder: (poId: string) => void;
  deleteSelectedProductionOrders: (poIds: string[]) => void;
  startProductionOrderTimer: (poId: string) => void;
  stopProductionOrderTimer: (poId: string, producedQuantity: number) => void;
  findProductionOrderById: (poId: string) => ProductionOrder | undefined;
  getProductionOrdersBySku: (skuId: string) => ProductionOrder[];

  demands: Demand[];
  addDemand: (demandData: Omit<Demand, 'id' | 'createdAt'>) => void;
  updateDemand: (demandId: string, demandData: Partial<Omit<Demand, 'id' | 'createdAt'>>) => void;
  deleteDemand: (demandId: string) => void;
  deleteSelectedDemands: (demandIds: string[]) => void;
  findDemandBySkuAndMonth: (skuId: string, monthYear: string) => Demand | undefined;
  isDataReady: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [skus, setSkus] = useState<SKU[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedSkus = window.localStorage.getItem(LOCAL_STORAGE_SKUS_KEY);
    const storedPOs = window.localStorage.getItem(LOCAL_STORAGE_PRODUCTION_ORDERS_KEY);
    const storedDemands = window.localStorage.getItem(LOCAL_STORAGE_DEMANDS_KEY);

    if (!storedSkus || JSON.parse(storedSkus).length === 0 ||
        !storedPOs || JSON.parse(storedPOs).length === 0 ||
        !storedDemands || JSON.parse(storedDemands).length === 0) {
      const { skus: initialSkus, productionOrders: initialPOs, demands: initialDemands } = initializeDummyData();
      setSkus(initialSkus);
      setProductionOrders(initialPOs);
      setDemands(initialDemands);
      saveToLocalStorage(LOCAL_STORAGE_SKUS_KEY, initialSkus);
      saveToLocalStorage(LOCAL_STORAGE_PRODUCTION_ORDERS_KEY, initialPOs);
      saveToLocalStorage(LOCAL_STORAGE_DEMANDS_KEY, initialDemands);
    } else {
      setSkus(loadFromLocalStorage(LOCAL_STORAGE_SKUS_KEY, []));
      setProductionOrders(loadFromLocalStorage(LOCAL_STORAGE_PRODUCTION_ORDERS_KEY, []));
      setDemands(loadFromLocalStorage(LOCAL_STORAGE_DEMANDS_KEY, []));
    }
  }, []);


  useEffect(() => {
    if (isMounted) {
      saveToLocalStorage(LOCAL_STORAGE_SKUS_KEY, skus);
    }
  }, [skus, isMounted]);

  useEffect(() => {
    if (isMounted) {
      saveToLocalStorage(LOCAL_STORAGE_PRODUCTION_ORDERS_KEY, productionOrders);
    }
  }, [productionOrders, isMounted]);

  useEffect(() => {
    if (isMounted) {
      saveToLocalStorage(LOCAL_STORAGE_DEMANDS_KEY, demands);
    }
  }, [demands, isMounted]);

  // Gerenciamento de SKU
  const addSku = useCallback((skuData: Omit<SKU, 'id' | 'createdAt'>) => {
    const newSku: SKU = { ...skuData, id: uuidv4(), createdAt: new Date().toISOString() };
    setSkus(prev => [...prev, newSku]);
  }, []);

  const updateSku = useCallback((skuId: string, skuData: Partial<Omit<SKU, 'id' | 'createdAt'>>) => {
    setSkus(prev => prev.map(s => s.id === skuId ? { ...s, ...skuData, code: skuData.code || s.code, description: skuData.description || s.description } : s));
  }, []);

  const deleteSku = useCallback((skuId: string) => {
    const sku = skus.find(s => s.id === skuId);
    const associatedPOs = productionOrders.filter(po => po.skuId === skuId);
    const associatedDemands = demands.filter(d => d.skuId === skuId);

    let reasons = [];
    if (associatedPOs.length > 0) reasons.push("Ordens de Produção");
    if (associatedDemands.length > 0) reasons.push("Demandas");

    if (reasons.length > 0) {
      throw new Error(`O SKU ${sku?.code || skuId} não pode ser excluído pois possui ${reasons.join(' e ')} associada(s).`);
    }

    setSkus(prev => prev.filter(s => s.id !== skuId));
  }, [productionOrders, demands, skus]);

  const deleteSelectedSkus = useCallback((skuIds: string[]): DeleteSelectedSkusResult => {
    const skusToDelete: string[] = [];
    const skusNotDeleted: { code: string; reason: string }[] = [];

    skuIds.forEach(skuId => {
      const sku = skus.find(s => s.id === skuId);
      if (!sku) return;

      const associatedPOs = productionOrders.filter(po => po.skuId === skuId);
      const associatedDemands = demands.filter(d => d.skuId === skuId);

      let reasons = [];
      if (associatedPOs.length > 0) reasons.push("Ordens de Produção");
      if (associatedDemands.length > 0) reasons.push("Demandas");

      if (reasons.length > 0) {
        skusNotDeleted.push({ code: sku.code, reason: reasons.join(' e ') });
      } else {
        skusToDelete.push(skuId);
      }
    });

    if (skusToDelete.length > 0) {
      setSkus(prev => prev.filter(s => !skusToDelete.includes(s.id)));
    }
    
    return {
      deletedCount: skusToDelete.length,
      notDeleted: skusNotDeleted,
    };
  }, [productionOrders, demands, skus]);

  const findSkuById = useCallback((skuId: string) => skus.find(s => s.id === skuId), [skus]);

  // Gerenciamento de Ordem de Produção
  const addProductionOrder = useCallback((poData: Omit<ProductionOrder, 'id' | 'createdAt' | 'status' | 'producedQuantity'>) => {
    const newPo: ProductionOrder = {
      ...poData,
      id: uuidv4(),
      status: 'Aberta',
      createdAt: new Date().toISOString()
    };
    setProductionOrders(prev => [...prev, newPo]);
  }, []);

  const updateProductionOrder = useCallback((poId: string, poData: Partial<Omit<ProductionOrder, 'id' | 'createdAt'>>) => {
    setProductionOrders(prev => prev.map(po => po.id === poId ? { ...po, ...poData } : po));
  }, []);

  const deleteProductionOrder = useCallback((poId: string) => {
    setProductionOrders(prev => prev.filter(po => po.id !== poId));
  }, []);

  const deleteSelectedProductionOrders = useCallback((poIds: string[]) => {
    setProductionOrders(prev => prev.filter(po => !poIds.includes(po.id)));
  }, []);

  const startProductionOrderTimer = useCallback((poId: string) => {
    setProductionOrders(prev => prev.map(po =>
      po.id === poId && po.status === 'Aberta' ? { ...po, status: 'Em Progresso', startTime: new Date().toISOString(), endTime: undefined, productionTime: undefined } : po
    ));
  }, []);

  const stopProductionOrderTimer = useCallback((poId: string, producedQuantity: number) => {
    setProductionOrders(prev => prev.map(po => {
      if (po.id === poId && po.status === 'Em Progresso' && po.startTime) {
        const endTime = new Date();
        const productionTime = Math.floor((endTime.getTime() - new Date(po.startTime).getTime()) / 1000);
        return { ...po, status: 'Concluída', endTime: endTime.toISOString(), productionTime, producedQuantity };
      }
      return po;
    }));
  }, []);

  const findProductionOrderById = useCallback((poId: string) => productionOrders.find(po => po.id === poId), [productionOrders]);
  const getProductionOrdersBySku = useCallback((skuId: string) => productionOrders.filter(po => po.skuId === skuId), [productionOrders]);


  // Gerenciamento de Demanda
  const addDemand = useCallback((demandData: Omit<Demand, 'id' | 'createdAt'>) => {
    const newDemand: Demand = { ...demandData, id: uuidv4(), createdAt: new Date().toISOString() };
    setDemands(prev => [...prev, newDemand]);
  }, []);

  const updateDemand = useCallback((demandId: string, demandData: Partial<Omit<Demand, 'id' | 'createdAt'>>) => {
    setDemands(prev => prev.map(d => d.id === demandId ? { ...d, ...demandData } : d));
  }, []);

  const deleteDemand = useCallback((demandId: string) => {
    setDemands(prev => prev.filter(d => d.id !== demandId));
  }, []);

  const deleteSelectedDemands = useCallback((demandIds: string[]) => {
    setDemands(prev => prev.filter(d => !demandIds.includes(d.id)));
  }, []);

  const findDemandBySkuAndMonth = useCallback((skuId: string, monthYear: string) => {
    return demands.find(d => d.skuId === skuId && d.monthYear === monthYear);
  }, [demands]);

  const contextValue = useMemo(() => ({
    skus: isMounted ? skus : [],
    addSku,
    updateSku,
    deleteSku,
    deleteSelectedSkus,
    findSkuById,
    productionOrders: isMounted ? productionOrders : [],
    addProductionOrder,
    updateProductionOrder,
    deleteProductionOrder,
    deleteSelectedProductionOrders,
    startProductionOrderTimer,
    stopProductionOrderTimer,
    findProductionOrderById,
    getProductionOrdersBySku,
    demands: isMounted ? demands : [],
    addDemand,
    updateDemand,
    deleteDemand,
    deleteSelectedDemands,
    findDemandBySkuAndMonth,
    isDataReady: isMounted,
  }), [
    isMounted, skus, productionOrders, demands,
    addSku, updateSku, deleteSku, deleteSelectedSkus, findSkuById,
    addProductionOrder, updateProductionOrder, deleteProductionOrder, deleteSelectedProductionOrders, startProductionOrderTimer, stopProductionOrderTimer, findProductionOrderById, getProductionOrdersBySku,
    addDemand, updateDemand, deleteDemand, deleteSelectedDemands, findDemandBySkuAndMonth
  ]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser utilizado dentro de um AppContextProvider');
  }
  return context;
};

