
"use client";

import type React from 'react';
import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { SKU, ProductionOrder, Demand, ProductionOrderStatus } from '@/types';
import {
  DUMMY_SKUS_DATA,
  DUMMY_PRODUCTION_ORDERS_DATA,
  DUMMY_DEMANDS_DATA,
} from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid'; // Ainda usado para IDs se Firestore não gerar, ou para mapeamento inicial
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  query,
  where,
  Timestamp, // Importar Timestamp
  serverTimestamp, // Para timestamps do servidor, se desejado
  getCountFromServer
} from 'firebase/firestore';

const SKUS_COLLECTION = 'skus';
const PRODUCTION_ORDERS_COLLECTION = 'productionOrders';
const DEMANDS_COLLECTION = 'demands';


interface DeleteSelectedSkusResult {
  deletedCount: number;
  notDeleted: { code: string; reason: string }[];
}

interface AppContextType {
  skus: SKU[];
  addSku: (skuData: Omit<SKU, 'id' | 'createdAt'>) => Promise<void>;
  updateSku: (skuId: string, skuData: Partial<Omit<SKU, 'id' | 'createdAt'>>) => Promise<void>;
  deleteSku: (skuId: string) => Promise<void>;
  deleteSelectedSkus: (skuIds: string[]) => Promise<DeleteSelectedSkusResult>;
  findSkuById: (skuId: string) => SKU | undefined;

  productionOrders: ProductionOrder[];
  addProductionOrder: (poData: Omit<ProductionOrder, 'id' | 'createdAt' | 'status' | 'producedQuantity'>) => Promise<void>;
  updateProductionOrder: (poId: string, poData: Partial<Omit<ProductionOrder, 'id' | 'createdAt'>>) => Promise<void>;
  deleteProductionOrder: (poId: string) => Promise<void>;
  deleteSelectedProductionOrders: (poIds: string[]) => Promise<void>;
  startProductionOrderTimer: (poId: string) => Promise<void>;
  stopProductionOrderTimer: (poId: string, producedQuantity: number) => Promise<void>;
  findProductionOrderById: (poId: string) => ProductionOrder | undefined;
  getProductionOrdersBySku: (skuId: string) => ProductionOrder[];

  demands: Demand[];
  addDemand: (demandData: Omit<Demand, 'id' | 'createdAt'>) => Promise<void>;
  updateDemand: (demandId: string, demandData: Partial<Omit<Demand, 'id' | 'createdAt'>>) => Promise<void>;
  deleteDemand: (demandId: string) => Promise<void>;
  deleteSelectedDemands: (demandIds: string[]) => Promise<void>;
  findDemandBySkuAndMonth: (skuId: string, monthYear: string) => Demand | undefined;
  isDataReady: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [skus, setSkus] = useState<SKU[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [isDataReady, setIsDataReady] = useState(false);

  const mapDocToSku = (docData: any): SKU => ({
    ...docData,
    // Firestore Timestamps precisam ser convertidos para strings ISO se necessário.
    // Aqui, estamos assumindo que createdAt é armazenado como string ISO ou será convertido na leitura.
    // Se usar Firestore Timestamp: createdAt: (docData.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
  } as SKU);

  const mapDocToProductionOrder = (docData: any): ProductionOrder => ({
    ...docData,
  } as ProductionOrder);

  const mapDocToDemand = (docData: any): Demand => ({
    ...docData,
  } as Demand);

  const seedDatabase = async () => {
    console.log("Verificando necessidade de popular o banco de dados...");
    const skusSnapshot = await getCountFromServer(collection(db, SKUS_COLLECTION));
    
    if (skusSnapshot.data().count === 0) {
      console.log("Populando SKUs...");
      const batch = writeBatch(db);
      const seededSkus: SKU[] = [];

      for (const skuData of DUMMY_SKUS_DATA) {
        const newSkuId = uuidv4(); // Gerar ID aqui para poder referenciar
        const newSku: SKU = { 
          ...skuData, 
          id: newSkuId, 
          createdAt: new Date().toISOString() 
        };
        const skuRef = doc(db, SKUS_COLLECTION, newSku.id);
        batch.set(skuRef, newSku);
        seededSkus.push(newSku);
      }
      await batch.commit();
      setSkus(seededSkus); // Atualiza o estado local com SKUs semeados e seus IDs
      console.log("SKUs populados.");

      // Popular Ordens de Produção
      console.log("Populando Ordens de Produção...");
      const poBatch = writeBatch(db);
      const seededPOs: ProductionOrder[] = [];
      DUMMY_PRODUCTION_ORDERS_DATA.forEach((poData, index) => {
        const skuForPo = seededSkus[index % seededSkus.length];
        if (!skuForPo) return;

        let status: ProductionOrderStatus = 'Aberta';
        if (index === 0) status = 'Concluída';
        else if (index === 1) status = 'Em Progresso';
        else if (index === 4) status = 'Concluída';
        
        const newPoId = uuidv4();
        const newPo: ProductionOrder = {
          ...poData,
          id: newPoId,
          skuId: skuForPo.id,
          status,
          producedQuantity: status === 'Concluída' ? poData.producedQuantity : undefined,
          endTime: status === 'Concluída' ? poData.endTime : undefined,
          productionTime: status === 'Concluída' ? poData.productionTime : undefined,
          createdAt: new Date(Date.now() - (DUMMY_PRODUCTION_ORDERS_DATA.length - index) * 10 * 60 * 1000).toISOString(),
        };
        const poRef = doc(db, PRODUCTION_ORDERS_COLLECTION, newPo.id);
        poBatch.set(poRef, newPo);
        seededPOs.push(newPo);
      });
      await poBatch.commit();
      setProductionOrders(seededPOs);
      console.log("Ordens de Produção populadas.");

      // Popular Demandas
      console.log("Populando Demandas...");
      const demandBatch = writeBatch(db);
      const seededDemands: Demand[] = [];
      DUMMY_DEMANDS_DATA.forEach((demandData, index) => {
        const skuForDemand = seededSkus[index % seededSkus.length];
        if (!skuForDemand) return;

        const newDemandId = uuidv4();
        const newDemand: Demand = {
          ...demandData,
          id: newDemandId,
          skuId: skuForDemand.id,
          createdAt: new Date().toISOString(),
        };
        const demandRef = doc(db, DEMANDS_COLLECTION, newDemand.id);
        demandBatch.set(demandRef, newDemand);
        seededDemands.push(newDemand);
      });
      await demandBatch.commit();
      setDemands(seededDemands);
      console.log("Demandas populadas.");
      console.log("Banco de dados populado com dados fictícios.");
    } else {
      console.log("Banco de dados já contém dados de SKUs.");
    }
  };


  const fetchData = async () => {
    setIsDataReady(false);
    try {
      console.log("Buscando dados do Firestore...");
      // Seed antes de buscar para garantir que os dados fictícios sejam usados se o DB estiver vazio
      await seedDatabase();

      const skusQuery = query(collection(db, SKUS_COLLECTION));
      const skusSnapshot = await getDocs(skusQuery);
      const skusData = skusSnapshot.docs.map(d => mapDocToSku({ id: d.id, ...d.data() }));
      setSkus(skusData);
      console.log("SKUs carregados:", skusData.length);

      const posQuery = query(collection(db, PRODUCTION_ORDERS_COLLECTION));
      const posSnapshot = await getDocs(posQuery);
      const posData = posSnapshot.docs.map(d => mapDocToProductionOrder({ id: d.id, ...d.data() }));
      setProductionOrders(posData);
      console.log("Ordens de Produção carregadas:", posData.length);
      
      const demandsQuery = query(collection(db, DEMANDS_COLLECTION));
      const demandsSnapshot = await getDocs(demandsQuery);
      const demandsData = demandsSnapshot.docs.map(d => mapDocToDemand({ id: d.id, ...d.data() }));
      setDemands(demandsData);
      console.log("Demandas carregadas:", demandsData.length);

    } catch (error) {
      console.error("Erro ao buscar dados do Firestore:", error);
      // Mantenha os arrays vazios ou dados de fallback se o fetch falhar
      setSkus([]);
      setProductionOrders([]);
      setDemands([]);
    } finally {
      setIsDataReady(true);
      console.log("Busca de dados concluída. isDataReady:", true);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  // Gerenciamento de SKU
  const addSku = useCallback(async (skuData: Omit<SKU, 'id' | 'createdAt'>) => {
    const newSkuId = uuidv4();
    const newSku: SKU = { ...skuData, id: newSkuId, createdAt: new Date().toISOString() };
    try {
      await addDoc(collection(db, SKUS_COLLECTION), { ...skuData, id: newSkuId, createdAt: new Date().toISOString() }); // Salva sem o id gerado pelo addDoc
      // Para manter o ID consistente, podemos usar setDoc com o ID gerado
      const docRef = doc(db, SKUS_COLLECTION, newSku.id);
      await updateDoc(docRef, newSku); // Usar updateDoc para setar o ID aqui pode ser redundante se já foi no addDoc, idealmente seria setDoc(doc(db, SKUS_COLLECTION, newSku.id), newSku)
                                    // Mas o addDoc não retorna o ID imediatamente para setar o estado.
                                    // Melhor abordagem:
      // const docRef = await addDoc(collection(db, SKUS_COLLECTION), { ...skuData, createdAt: new Date().toISOString() });
      // const newSku: SKU = { ...skuData, id: docRef.id, createdAt: new Date().toISOString() };
      // setSkus(prev => [...prev, newSku]);
      // Correção: usar setDoc para garantir o ID
      await setDoc(doc(db, SKUS_COLLECTION, newSku.id), newSku);
      setSkus(prev => [...prev, newSku]);
    } catch (error) {
      console.error("Erro ao adicionar SKU:", error);
    }
  }, []);

  const updateSku = useCallback(async (skuId: string, skuData: Partial<Omit<SKU, 'id' | 'createdAt'>>) => {
    try {
      const skuRef = doc(db, SKUS_COLLECTION, skuId);
      await updateDoc(skuRef, skuData);
      setSkus(prev => prev.map(s => s.id === skuId ? { ...s, ...skuData, code: skuData.code || s.code, description: skuData.description || s.description } : s));
    } catch (error) {
      console.error("Erro ao atualizar SKU:", error);
    }
  }, []);

  const deleteSku = useCallback(async (skuId: string) => {
    const sku = skus.find(s => s.id === skuId);
    const posQuery = query(collection(db, PRODUCTION_ORDERS_COLLECTION), where("skuId", "==", skuId));
    const demandsQuery = query(collection(db, DEMANDS_COLLECTION), where("skuId", "==", skuId));

    const [posSnapshot, demandsSnapshot] = await Promise.all([getDocs(posQuery), getDocs(demandsQuery)]);
    
    const associatedPOs = posSnapshot.docs;
    const associatedDemands = demandsSnapshot.docs;

    let reasons = [];
    if (associatedPOs.length > 0) reasons.push("Ordens de Produção");
    if (associatedDemands.length > 0) reasons.push("Demandas");

    if (reasons.length > 0) {
      throw new Error(`O SKU ${sku?.code || skuId} não pode ser excluído pois possui ${reasons.join(' e ')} associada(s).`);
    }
    try {
      await deleteDoc(doc(db, SKUS_COLLECTION, skuId));
      setSkus(prev => prev.filter(s => s.id !== skuId));
    } catch (error) {
      console.error("Erro ao excluir SKU:", error);
      throw error; // Re-lança para ser pego pelo toast
    }
  }, [skus]);

  const deleteSelectedSkus = useCallback(async (skuIds: string[]): Promise<DeleteSelectedSkusResult> => {
    const skusToDeleteCompletely: string[] = [];
    const skusNotDeleted: { code: string; reason: string }[] = [];
    const batch = writeBatch(db);

    for (const skuId of skuIds) {
      const sku = skus.find(s => s.id === skuId);
      if (!sku) continue;

      const posQuery = query(collection(db, PRODUCTION_ORDERS_COLLECTION), where("skuId", "==", skuId));
      const demandsQuery = query(collection(db, DEMANDS_COLLECTION), where("skuId", "==", skuId));
      const [posSnapshot, demandsSnapshot] = await Promise.all([getDocs(posQuery), getDocs(demandsQuery)]);
      
      const associatedPOs = posSnapshot.docs;
      const associatedDemands = demandsSnapshot.docs;

      let reasons = [];
      if (associatedPOs.length > 0) reasons.push("Ordens de Produção");
      if (associatedDemands.length > 0) reasons.push("Demandas");

      if (reasons.length > 0) {
        skusNotDeleted.push({ code: sku.code, reason: reasons.join(' e ') });
      } else {
        skusToDeleteCompletely.push(skuId);
        batch.delete(doc(db, SKUS_COLLECTION, skuId));
      }
    }

    if (skusToDeleteCompletely.length > 0) {
      try {
        await batch.commit();
        setSkus(prev => prev.filter(s => !skusToDeleteCompletely.includes(s.id)));
      } catch (error) {
         console.error("Erro ao excluir SKUs em lote:", error);
         // Reverter a exclusão do estado local se o batch falhar é complexo,
         // Idealmente, buscaria os dados novamente ou informaria um erro genérico.
         // Por simplicidade, apenas logamos e retornamos o que não foi deletado.
         skusToDeleteCompletely.forEach(id => {
            const sku = skus.find(s => s.id === id);
            if(sku) skusNotDeleted.push({code: sku.code, reason: "Erro no servidor durante exclusão"});
         });
         return { deletedCount: 0, notDeleted: skusNotDeleted };
      }
    }
    
    return {
      deletedCount: skusToDeleteCompletely.length,
      notDeleted: skusNotDeleted,
    };
  }, [skus]);

  const findSkuById = useCallback((skuId: string) => skus.find(s => s.id === skuId), [skus]);

  // Gerenciamento de Ordem de Produção
  const addProductionOrder = useCallback(async (poData: Omit<ProductionOrder, 'id' | 'createdAt' | 'status' | 'producedQuantity'>) => {
    const newPoId = uuidv4();
    const newPo: ProductionOrder = {
      ...poData,
      id: newPoId,
      status: 'Aberta',
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, PRODUCTION_ORDERS_COLLECTION, newPo.id), newPo);
      setProductionOrders(prev => [...prev, newPo]);
    } catch (error) {
      console.error("Erro ao adicionar Ordem de Produção:", error);
    }
  }, []);

  const updateProductionOrder = useCallback(async (poId: string, poData: Partial<Omit<ProductionOrder, 'id' | 'createdAt'>>) => {
    try {
      const poRef = doc(db, PRODUCTION_ORDERS_COLLECTION, poId);
      await updateDoc(poRef, poData);
      setProductionOrders(prev => prev.map(po => po.id === poId ? { ...po, ...poData } : po));
    } catch (error) {
      console.error("Erro ao atualizar Ordem de Produção:", error);
    }
  }, []);

  const deleteProductionOrder = useCallback(async (poId: string) => {
    try {
      await deleteDoc(doc(db, PRODUCTION_ORDERS_COLLECTION, poId));
      setProductionOrders(prev => prev.filter(po => po.id !== poId));
    } catch (error) {
      console.error("Erro ao excluir Ordem de Produção:", error);
    }
  }, []);

  const deleteSelectedProductionOrders = useCallback(async (poIds: string[]) => {
    const batch = writeBatch(db);
    poIds.forEach(id => batch.delete(doc(db, PRODUCTION_ORDERS_COLLECTION, id)));
    try {
      await batch.commit();
      setProductionOrders(prev => prev.filter(po => !poIds.includes(po.id)));
    } catch (error) {
      console.error("Erro ao excluir Ordens de Produção em lote:", error);
    }
  }, []);

  const startProductionOrderTimer = useCallback(async (poId: string) => {
    const updateData = { status: 'Em Progresso' as ProductionOrderStatus, startTime: new Date().toISOString(), endTime: undefined, productionTime: undefined };
    try {
      const poRef = doc(db, PRODUCTION_ORDERS_COLLECTION, poId);
      await updateDoc(poRef, updateData);
      setProductionOrders(prev => prev.map(po =>
        po.id === poId && po.status === 'Aberta' ? { ...po, ...updateData } : po
      ));
    } catch (error) {
      console.error("Erro ao iniciar timer da OP:", error);
    }
  }, []);

  const stopProductionOrderTimer = useCallback(async (poId: string, producedQuantity: number) => {
    const poToUpdate = productionOrders.find(po => po.id === poId);
    if (poToUpdate && poToUpdate.status === 'Em Progresso' && poToUpdate.startTime) {
      const endTime = new Date();
      const productionTime = Math.floor((endTime.getTime() - new Date(poToUpdate.startTime).getTime()) / 1000);
      const updateData = { status: 'Concluída' as ProductionOrderStatus, endTime: endTime.toISOString(), productionTime, producedQuantity };
      try {
        const poRef = doc(db, PRODUCTION_ORDERS_COLLECTION, poId);
        await updateDoc(poRef, updateData);
        setProductionOrders(prev => prev.map(po => po.id === poId ? { ...po, ...updateData } : po));
      } catch (error) {
        console.error("Erro ao parar timer da OP:", error);
      }
    }
  }, [productionOrders]);

  const findProductionOrderById = useCallback((poId: string) => productionOrders.find(po => po.id === poId), [productionOrders]);
  const getProductionOrdersBySku = useCallback((skuId: string) => productionOrders.filter(po => po.skuId === skuId), [productionOrders]);

  // Gerenciamento de Demanda
  const addDemand = useCallback(async (demandData: Omit<Demand, 'id' | 'createdAt'>) => {
    const newDemandId = uuidv4();
    const newDemand: Demand = { ...demandData, id: newDemandId, createdAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, DEMANDS_COLLECTION, newDemand.id), newDemand);
      setDemands(prev => [...prev, newDemand]);
    } catch (error) {
      console.error("Erro ao adicionar Demanda:", error);
    }
  }, []);

  const updateDemand = useCallback(async (demandId: string, demandData: Partial<Omit<Demand, 'id' | 'createdAt'>>) => {
    try {
      const demandRef = doc(db, DEMANDS_COLLECTION, demandId);
      await updateDoc(demandRef, demandData);
      setDemands(prev => prev.map(d => d.id === demandId ? { ...d, ...demandData } : d));
    } catch (error) {
      console.error("Erro ao atualizar Demanda:", error);
    }
  }, []);

  const deleteDemand = useCallback(async (demandId: string) => {
    try {
      await deleteDoc(doc(db, DEMANDS_COLLECTION, demandId));
      setDemands(prev => prev.filter(d => d.id !== demandId));
    } catch (error) {
      console.error("Erro ao excluir Demanda:", error);
    }
  }, []);

  const deleteSelectedDemands = useCallback(async (demandIds: string[]) => {
    const batch = writeBatch(db);
    demandIds.forEach(id => batch.delete(doc(db, DEMANDS_COLLECTION, id)));
    try {
      await batch.commit();
      setDemands(prev => prev.filter(d => !demandIds.includes(d.id)));
    } catch (error) {
      console.error("Erro ao excluir Demandas em lote:", error);
    }
  }, []);

  const findDemandBySkuAndMonth = useCallback((skuId: string, monthYear: string) => {
    return demands.find(d => d.skuId === skuId && d.monthYear === monthYear);
  }, [demands]);

  const contextValue = useMemo(() => ({
    skus,
    addSku,
    updateSku,
    deleteSku,
    deleteSelectedSkus,
    findSkuById,
    productionOrders,
    addProductionOrder,
    updateProductionOrder,
    deleteProductionOrder,
    deleteSelectedProductionOrders,
    startProductionOrderTimer,
    stopProductionOrderTimer,
    findProductionOrderById,
    getProductionOrdersBySku,
    demands,
    addDemand,
    updateDemand,
    deleteDemand,
    deleteSelectedDemands,
    findDemandBySkuAndMonth,
    isDataReady,
  }), [
    skus, productionOrders, demands, isDataReady,
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
