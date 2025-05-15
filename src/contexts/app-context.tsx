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
  PRODUCTION_ORDER_STATUSES
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
      ...poData,
      id: uuidv4(),
      skuId: initialSkus[index % initialSkus.length].id, // Garante que o skuId existe
      status,
      createdAt: new Date(Date.now() - (DUMMY_PRODUCTION_ORDERS_DATA.length - index) * 10 * 60 * 1000).toISOString(), // Datas de criação escalonadas
    };
  });
  
  const initialDemands: Demand[] = DUMMY_DEMANDS_DATA.map((demandData, index) => ({
    ...demandData,
    id: uuidv4(),
    skuId: initialSkus[index % initialSkus.length].id, // Garante que o skuId existe
    createdAt: new Date().toISOString(),
  }));

  return { skus: initialSkus, productionOrders: initialProductionOrders, demands: initialDemands };
};


interface AppContextType {
  skus: SKU[];
  addSku: (skuData: Omit<SKU, 'id' | 'createdAt'>) => void;
  updateSku: (skuId: string, skuData: Partial<Omit<SKU, 'id' | 'createdAt'>>) => void;
  deleteSku: (skuId: string) => void;
  findSkuById: (skuId: string) => SKU | undefined;

  productionOrders: ProductionOrder[];
  addProductionOrder: (poData: Omit<ProductionOrder, 'id' | 'createdAt' | 'status'>) => void;
  updateProductionOrder: (poId: string, poData: Partial<Omit<ProductionOrder, 'id' | 'createdAt'>>) => void;
  deleteProductionOrder: (poId: string) => void;
  startProductionOrderTimer: (poId: string) => void;
  stopProductionOrderTimer: (poId: string) => void;
  findProductionOrderById: (poId: string) => ProductionOrder | undefined;
  getProductionOrdersBySku: (skuId: string) => ProductionOrder[];

  demands: Demand[];
  addDemand: (demandData: Omit<Demand, 'id' | 'createdAt'>) => void;
  updateDemand: (demandId: string, demandData: Partial<Omit<Demand, 'id' | 'createdAt'>>) => void;
  deleteDemand: (demandId: string) => void;
  findDemandBySkuAndMonth: (skuId: string, monthYear: string) => Demand | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [skus, setSkus] = useState<SKU[]>(() => loadFromLocalStorage(LOCAL_STORAGE_SKUS_KEY, []));
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(() => loadFromLocalStorage(LOCAL_STORAGE_PRODUCTION_ORDERS_KEY, []));
  const [demands, setDemands] = useState<Demand[]>(() => loadFromLocalStorage(LOCAL_STORAGE_DEMANDS_KEY, []));
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Se o localStorage estiver vazio na primeira carga, inicialize com dados fictícios
    if (typeof window !== 'undefined') {
      const storedSkus = window.localStorage.getItem(LOCAL_STORAGE_SKUS_KEY);
      if (!storedSkus || JSON.parse(storedSkus).length === 0) {
        const { skus: initialSkus, productionOrders: initialPOs, demands: initialDemands } = initializeDummyData();
        setSkus(initialSkus);
        setProductionOrders(initialPOs);
        setDemands(initialDemands);
        saveToLocalStorage(LOCAL_STORAGE_SKUS_KEY, initialSkus);
        saveToLocalStorage(LOCAL_STORAGE_PRODUCTION_ORDERS_KEY, initialPOs);
        saveToLocalStorage(LOCAL_STORAGE_DEMANDS_KEY, initialDemands);
      }
      setIsInitialLoad(false);
    }
  }, []);


  // Salvar SKUs no localStorage sempre que mudarem (exceto na carga inicial, se já existiam)
  useEffect(() => {
    if (!isInitialLoad) {
      saveToLocalStorage(LOCAL_STORAGE_SKUS_KEY, skus);
    }
  }, [skus, isInitialLoad]);

  // Salvar Ordens de Produção no localStorage
  useEffect(() => {
    if (!isInitialLoad) {
      saveToLocalStorage(LOCAL_STORAGE_PRODUCTION_ORDERS_KEY, productionOrders);
    }
  }, [productionOrders, isInitialLoad]);

  // Salvar Demandas no localStorage
  useEffect(() => {
    if (!isInitialLoad) {
      saveToLocalStorage(LOCAL_STORAGE_DEMANDS_KEY, demands);
    }
  }, [demands, isInitialLoad]);

  // Gerenciamento de SKU
  const addSku = useCallback((skuData: Omit<SKU, 'id' | 'createdAt'>) => {
    const newSku: SKU = { ...skuData, id: uuidv4(), createdAt: new Date().toISOString() };
    setSkus(prev => [...prev, newSku]);
  }, []);

  const updateSku = useCallback((skuId: string, skuData: Partial<Omit<SKU, 'id' | 'createdAt'>>) => {
    setSkus(prev => prev.map(s => s.id === skuId ? { ...s, ...skuData, code: skuData.code || s.code, description: skuData.description || s.description } : s));
  }, []);

  const deleteSku = useCallback((skuId: string) => {
    setSkus(prev => prev.filter(s => s.id !== skuId));
    // Opcional: lidar com exclusões em cascata ou avisos para OPs/Demandas relacionadas
  }, []);
  
  const findSkuById = useCallback((skuId: string) => skus.find(s => s.id === skuId), [skus]);

  // Gerenciamento de Ordem de Produção
  const addProductionOrder = useCallback((poData: Omit<ProductionOrder, 'id' | 'createdAt' | 'status'>) => {
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

  const startProductionOrderTimer = useCallback((poId: string) => {
    setProductionOrders(prev => prev.map(po => 
      po.id === poId && po.status === 'Aberta' ? { ...po, status: 'Em Progresso', startTime: new Date().toISOString(), endTime: undefined, productionTime: undefined } : po
    ));
  }, []);

  const stopProductionOrderTimer = useCallback((poId: string) => {
    setProductionOrders(prev => prev.map(po => {
      if (po.id === poId && po.status === 'Em Progresso' && po.startTime) {
        const endTime = new Date();
        const productionTime = Math.floor((endTime.getTime() - new Date(po.startTime).getTime()) / 1000); // Em segundos
        return { ...po, status: 'Concluída', endTime: endTime.toISOString(), productionTime };
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

  const findDemandBySkuAndMonth = useCallback((skuId: string, monthYear: string) => {
    return demands.find(d => d.skuId === skuId && d.monthYear === monthYear);
  }, [demands]);

  const contextValue = useMemo(() => ({
    skus, addSku, updateSku, deleteSku, findSkuById,
    productionOrders, addProductionOrder, updateProductionOrder, deleteProductionOrder, startProductionOrderTimer, stopProductionOrderTimer, findProductionOrderById, getProductionOrdersBySku,
    demands, addDemand, updateDemand, deleteDemand, findDemandBySkuAndMonth,
  }), [skus, productionOrders, demands, findSkuById, getProductionOrdersBySku, findProductionOrderById, findDemandBySkuAndMonth, addSku, updateSku, deleteSku, addProductionOrder, updateProductionOrder, deleteProductionOrder, startProductionOrderTimer, stopProductionOrderTimer, addDemand, updateDemand, deleteDemand]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser utilizado dentro de um AppContextProvider');
  }
  return context;
};
