"use client";

import type React from 'react';
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { SKU, ProductionOrder, Demand, ProductionOrderStatus } from '@/types';
import { DUMMY_SKUS, DUMMY_PRODUCTION_ORDERS, DUMMY_DEMANDS } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid'; // Needs npm install uuid @types/uuid

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
  const [skus, setSkus] = useState<SKU[]>(DUMMY_SKUS);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(DUMMY_PRODUCTION_ORDERS);
  const [demands, setDemands] = useState<Demand[]>(DUMMY_DEMANDS);

  // SKU Management
  const addSku = useCallback((skuData: Omit<SKU, 'id' | 'createdAt'>) => {
    const newSku: SKU = { ...skuData, id: uuidv4(), createdAt: new Date().toISOString() };
    setSkus(prev => [...prev, newSku]);
  }, []);

  const updateSku = useCallback((skuId: string, skuData: Partial<Omit<SKU, 'id' | 'createdAt'>>) => {
    setSkus(prev => prev.map(s => s.id === skuId ? { ...s, ...skuData } : s));
  }, []);

  const deleteSku = useCallback((skuId: string) => {
    setSkus(prev => prev.filter(s => s.id !== skuId));
    // Optionally, handle cascading deletes or warnings for related POs/Demands
  }, []);
  
  const findSkuById = useCallback((skuId: string) => skus.find(s => s.id === skuId), [skus]);

  // Production Order Management
  const addProductionOrder = useCallback((poData: Omit<ProductionOrder, 'id' | 'createdAt' | 'status'>) => {
    const newPo: ProductionOrder = { 
      ...poData, 
      id: uuidv4(), 
      status: 'Open', 
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
      po.id === poId ? { ...po, status: 'In Progress', startTime: new Date().toISOString(), endTime: undefined, productionTime: undefined } : po
    ));
  }, []);

  const stopProductionOrderTimer = useCallback((poId: string) => {
    setProductionOrders(prev => prev.map(po => {
      if (po.id === poId && po.startTime) {
        const endTime = new Date();
        const productionTime = Math.floor((endTime.getTime() - new Date(po.startTime).getTime()) / 1000);
        return { ...po, status: 'Completed', endTime: endTime.toISOString(), productionTime };
      }
      return po;
    }));
  }, []);

  const findProductionOrderById = useCallback((poId: string) => productionOrders.find(po => po.id === poId), [productionOrders]);
  const getProductionOrdersBySku = useCallback((skuId: string) => productionOrders.filter(po => po.skuId === skuId), [productionOrders]);


  // Demand Management
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
  }), [skus, addSku, updateSku, deleteSku, findSkuById, productionOrders, addProductionOrder, updateProductionOrder, deleteProductionOrder, startProductionOrderTimer, stopProductionOrderTimer, findProductionOrderById, getProductionOrdersBySku, demands, addDemand, updateDemand, deleteDemand, findDemandBySkuAndMonth]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
