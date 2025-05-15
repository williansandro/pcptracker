
"use client";

import type React from 'react';
import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { SKU, ProductionOrder, Demand, ProductionOrderStatus } from '@/types';
import {
  DUMMY_SKUS_DATA,
  DUMMY_PRODUCTION_ORDERS_DATA,
  DUMMY_DEMANDS_DATA,
} from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  query,
  where,
  getCountFromServer,
  setDoc,
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

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
  addProductionOrder: (poData: Omit<ProductionOrder, 'id' | 'createdAt' | 'status' | 'producedQuantity' | 'startTime' | 'endTime' | 'productionTime'>) => Promise<void>;
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
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const mapDocToSku = (docData: any): SKU => ({
    ...docData,
  } as SKU);

  const mapDocToProductionOrder = (docData: any): ProductionOrder => ({
    ...docData,
  } as ProductionOrder);

  const mapDocToDemand = (docData: any): Demand => ({
    ...docData,
  } as Demand);

  const seedDatabase = useCallback(async () => {
    console.log("Verificando necessidade de popular o banco de dados...");
    const skusCollectionRef = collection(db, SKUS_COLLECTION);
    const skusSnapshot = await getCountFromServer(skusCollectionRef);
    
    if (skusSnapshot.data().count === 0) {
      console.log("Populando SKUs...");
      const batchSkus = writeBatch(db);
      const seededSkus: SKU[] = [];

      for (const skuData of DUMMY_SKUS_DATA) {
        const newSkuId = uuidv4(); 
        const newSku: SKU = { 
          ...skuData, 
          id: newSkuId, 
          createdAt: new Date().toISOString() 
        };
        const skuRef = doc(db, SKUS_COLLECTION, newSku.id);
        batchSkus.set(skuRef, newSku);
        seededSkus.push(newSku);
      }
      await batchSkus.commit();
      console.log("SKUs populados:", seededSkus.length);

      console.log("Populando Ordens de Produção...");
      const batchPOs = writeBatch(db);
      const seededPOs: ProductionOrder[] = [];
      DUMMY_PRODUCTION_ORDERS_DATA.forEach((poData, index) => {
        const skuForPo = seededSkus[index % seededSkus.length]; // Garante que sempre haja um SKU
        if (!skuForPo) {
          console.warn("SKU não encontrado para popular OP, pulando:", poData);
          return;
        }

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
          startTime: status === 'Em Progresso' || status === 'Concluída' ? poData.startTime : undefined,
          endTime: status === 'Concluída' ? poData.endTime : undefined,
          productionTime: status === 'Concluída' ? poData.productionTime : undefined,
          createdAt: new Date(Date.now() - (DUMMY_PRODUCTION_ORDERS_DATA.length - index) * 10 * 60 * 1000).toISOString(),
        };
        const poRef = doc(db, PRODUCTION_ORDERS_COLLECTION, newPo.id);
        batchPOs.set(poRef, newPo);
        seededPOs.push(newPo);
      });
      await batchPOs.commit();
      console.log("Ordens de Produção populadas:", seededPOs.length);

      console.log("Populando Demandas...");
      const batchDemands = writeBatch(db);
      const seededDemands: Demand[] = [];
      DUMMY_DEMANDS_DATA.forEach((demandData, index) => {
        const skuForDemand = seededSkus[index % seededSkus.length];
         if (!skuForDemand) {
          console.warn("SKU não encontrado para popular Demanda, pulando:", demandData);
          return;
        }
        const newDemandId = uuidv4();
        const newDemand: Demand = {
          ...demandData,
          id: newDemandId,
          skuId: skuForDemand.id,
          createdAt: new Date().toISOString(),
        };
        const demandRef = doc(db, DEMANDS_COLLECTION, newDemand.id);
        batchDemands.set(demandRef, newDemand);
        seededDemands.push(newDemand);
      });
      await batchDemands.commit();
      console.log("Demandas populadas:", seededDemands.length);
      console.log("Banco de dados populado com dados fictícios.");
      return { skus: seededSkus, pos: seededPOs, demands: seededDemands };
    } else {
      console.log("Banco de dados já contém dados de SKUs.");
      return null; // Indica que não houve seeding
    }
  }, []);


  const fetchData = useCallback(async () => {
    try {
      console.log("Buscando dados do Firestore...");
      const seededData = await seedDatabase();

      if (seededData) { // Se o banco foi populado, usa os dados retornados para evitar re-fetch
        setSkus(seededData.skus);
        setProductionOrders(seededData.pos);
        setDemands(seededData.demands);
        console.log("Dados do seeding aplicados ao estado local.");
      } else { // Se não houve seeding, busca do banco
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
      }

    } catch (error: any) {
      console.error("Erro ao buscar dados do Firestore:", error);
      toast({
        title: "Erro de Conexão",
        description: `Não foi possível carregar os dados do banco. ${error.message}`,
        variant: "destructive",
      });
      setSkus([]);
      setProductionOrders([]);
      setDemands([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, seedDatabase]); // Adicionado seedDatabase como dependência

  useEffect(() => {
    if (!isMounted) return;
    fetchData();
  }, [isMounted, fetchData]);


  // Gerenciamento de SKU
  const addSku = useCallback(async (skuData: Omit<SKU, 'id' | 'createdAt'>) => {
    const newSkuId = uuidv4();
    const newSku: SKU = { ...skuData, id: newSkuId, createdAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, SKUS_COLLECTION, newSku.id), newSku);
      setSkus(prev => [...prev, newSku]);
    } catch (error: any) {
      console.error("Erro ao adicionar SKU:", newSku.id, error);
      toast({
        title: "Erro ao Adicionar SKU",
        description: `Não foi possível adicionar o SKU. ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateSku = useCallback(async (skuId: string, skuData: Partial<Omit<SKU, 'id' | 'createdAt'>>) => {
    try {
      const skuRef = doc(db, SKUS_COLLECTION, skuId);
      await updateDoc(skuRef, skuData);
      setSkus(prev => prev.map(s => s.id === skuId ? { ...s, ...skuData, code: skuData.code || s.code, description: skuData.description || s.description } as SKU : s));
    } catch (error: any)      {
      console.error("Erro ao atualizar SKU:", skuId, error);
      toast({
        title: "Erro ao Atualizar SKU",
        description: (error as Error).message || "Não foi possível atualizar o SKU.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteSku = useCallback(async (skuId: string) => {
    const skuToDelete = skus.find(s => s.id === skuId);
    if (!skuToDelete) {
        console.error("Tentativa de excluir SKU não encontrado no estado local:", skuId);
        toast({ title: "Erro Interno", description: "SKU não encontrado para exclusão.", variant: "destructive" });
        return;
    }

    const posQuery = query(collection(db, PRODUCTION_ORDERS_COLLECTION), where("skuId", "==", skuId));
    const demandsQuery = query(collection(db, DEMANDS_COLLECTION), where("skuId", "==", skuId));

    const [posSnapshot, demandsSnapshot] = await Promise.all([
        getCountFromServer(posQuery),
        getCountFromServer(demandsQuery)
    ]);
    
    const associatedPOsCount = posSnapshot.data().count;
    const associatedDemandsCount = demandsSnapshot.data().count;

    let reasons = [];
    if (associatedPOsCount > 0) reasons.push("Ordens de Produção");
    if (associatedDemandsCount > 0) reasons.push("Demandas");

    if (reasons.length > 0) {
      const errorMessage = `O SKU ${skuToDelete.code} não pode ser excluído pois possui ${reasons.join(' e ')} associada(s).`;
      console.error(errorMessage);
      throw new Error(errorMessage); // Lança para ser pego pelo SkuActions
    }
    try {
      await deleteDoc(doc(db, SKUS_COLLECTION, skuId));
      setSkus(prev => prev.filter(s => s.id !== skuId));
    } catch (error: any) {
      console.error("Erro ao excluir SKU do Firestore:", skuId, error);
      toast({
        title: "Erro ao Excluir SKU",
        description: (error as Error).message || "Não foi possível excluir o SKU do banco de dados.",
        variant: "destructive",
      });
      throw error; 
    }
  }, [skus, toast]);

  const deleteSelectedSkus = useCallback(async (skuIds: string[]): Promise<DeleteSelectedSkusResult> => {
    const skusToDeleteCompletely: string[] = [];
    const skusNotDeleted: { code: string; reason: string }[] = [];
    const batch = writeBatch(db);
    
    const currentSkusState = skus; 

    for (const skuId of skuIds) {
      const sku = currentSkusState.find(s => s.id === skuId);
      if (!sku) {
        console.warn("SKU selecionado para exclusão não encontrado no estado:", skuId);
        continue;
      }

      const posQuery = query(collection(db, PRODUCTION_ORDERS_COLLECTION), where("skuId", "==", skuId));
      const demandsQuery = query(collection(db, DEMANDS_COLLECTION), where("skuId", "==", skuId));
      const [posSnapshot, demandsSnapshot] = await Promise.all([
        getCountFromServer(posQuery),
        getCountFromServer(demandsQuery)
      ]);
      
      const associatedPOsCount = posSnapshot.data().count;
      const associatedDemandsCount = demandsSnapshot.data().count;

      let reasons = [];
      if (associatedPOsCount > 0) reasons.push("Ordens de Produção");
      if (associatedDemandsCount > 0) reasons.push("Demandas");

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
      } catch (error: any) {
         console.error("Erro ao excluir SKUs em lote do Firestore:", error);
         const tempNotDeleted = [...skusNotDeleted];
         skusToDeleteCompletely.forEach(id => {
            const sku = currentSkusState.find(s => s.id === id);
            if(sku && !tempNotDeleted.find(nd => nd.code === sku.code)) {
                 tempNotDeleted.push({code: sku.code, reason: "Erro no servidor durante exclusão"});
            }
         });
         toast({
            title: "Erro ao Excluir Alguns SKUs",
            description: (error as Error).message || "Uma falha ocorreu ao tentar excluir alguns SKUs.",
            variant: "destructive",
         });
         return { deletedCount: 0, notDeleted: tempNotDeleted };
      }
    }
    
    return {
      deletedCount: skusToDeleteCompletely.length,
      notDeleted: skusNotDeleted,
    };
  }, [skus, toast]);

  const findSkuById = useCallback((skuId: string) => skus.find(s => s.id === skuId), [skus]);

  // Gerenciamento de Ordem de Produção
  const addProductionOrder = useCallback(async (poData: Omit<ProductionOrder, 'id' | 'createdAt' | 'status' | 'producedQuantity' | 'startTime' | 'endTime' | 'productionTime'>) => {
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
    } catch (error: any) {
      console.error("Erro ao adicionar Ordem de Produção:", newPo.id, error);
      toast({
        title: "Erro ao Adicionar OP",
        description: `Não foi possível adicionar a Ordem de Produção. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateProductionOrder = useCallback(async (poId: string, poData: Partial<Omit<ProductionOrder, 'id' | 'createdAt'>>) => {
    try {
      const poRef = doc(db, PRODUCTION_ORDERS_COLLECTION, poId);
      await updateDoc(poRef, poData);
      setProductionOrders(prev => prev.map(po => po.id === poId ? { ...po, ...poData } as ProductionOrder : po));
    } catch (error: any) {
      console.error("Erro ao atualizar Ordem de Produção:", poId, error);
      toast({
        title: "Erro ao Atualizar OP",
        description: `Não foi possível atualizar a Ordem de Produção. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteProductionOrder = useCallback(async (poId: string) => {
    try {
      await deleteDoc(doc(db, PRODUCTION_ORDERS_COLLECTION, poId));
      setProductionOrders(prev => prev.filter(po => po.id !== poId));
    } catch (error: any) {
      console.error("Erro ao excluir Ordem de Produção:", poId, error);
       toast({
        title: "Erro ao Excluir OP",
        description: `Não foi possível excluir a Ordem de Produção. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteSelectedProductionOrders = useCallback(async (poIds: string[]) => {
    const batch = writeBatch(db);
    poIds.forEach(id => batch.delete(doc(db, PRODUCTION_ORDERS_COLLECTION, id)));
    try {
      await batch.commit();
      setProductionOrders(prev => prev.filter(po => !poIds.includes(po.id)));
    } catch (error: any) {
      console.error("Erro ao excluir Ordens de Produção em lote:", error);
      toast({
        title: "Erro ao Excluir OPs",
        description: `Não foi possível excluir as Ordens de Produção selecionadas. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const startProductionOrderTimer = useCallback(async (poId: string) => {
    const poToUpdate = productionOrders.find(po => po.id === poId);
    if (poToUpdate?.status !== 'Aberta') {
        toast({ title: "Ação Inválida", description: "Só é possível iniciar OPs com status 'Aberta'.", variant: "default" });
        return;
    }
    const updateData = { status: 'Em Progresso' as ProductionOrderStatus, startTime: new Date().toISOString(), endTime: undefined, productionTime: undefined };
    try {
      const poRef = doc(db, PRODUCTION_ORDERS_COLLECTION, poId);
      await updateDoc(poRef, updateData);
      setProductionOrders(prev => prev.map(po =>
        po.id === poId ? { ...po, ...updateData } : po
      ));
    } catch (error: any) {
      console.error("Erro ao iniciar timer da OP:", poId, error);
       toast({
        title: "Erro ao Iniciar Timer",
        description: `Não foi possível iniciar o timer da OP. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [productionOrders, toast]);

  const stopProductionOrderTimer = useCallback(async (poId: string, producedQuantity: number) => {
    const poToUpdate = productionOrders.find(po => po.id === poId);
    if (poToUpdate && poToUpdate.status === 'Em Progresso' && poToUpdate.startTime) {
      const endTime = new Date();
      const productionTime = Math.floor((endTime.getTime() - new Date(poToUpdate.startTime).getTime()) / 1000); // em segundos
      const updateData = { status: 'Concluída' as ProductionOrderStatus, endTime: endTime.toISOString(), productionTime, producedQuantity };
      try {
        const poRef = doc(db, PRODUCTION_ORDERS_COLLECTION, poId);
        await updateDoc(poRef, updateData);
        setProductionOrders(prev => prev.map(po => po.id === poId ? { ...po, ...updateData } : po));
      } catch (error: any) {
        console.error("Erro ao parar timer da OP:", poId, error);
        toast({
            title: "Erro ao Finalizar OP",
            description: `Não foi possível finalizar a OP e parar o timer. ${(error as Error).message}`,
            variant: "destructive",
        });
      }
    } else {
        console.warn("Tentativa de parar timer para OP não elegível:", poId, poToUpdate?.status);
        toast({ title: "Ação Inválida", description: "Não foi possível finalizar esta OP. Verifique seu status.", variant: "default"});
    }
  }, [productionOrders, toast]);

  const findProductionOrderById = useCallback((poId: string) => productionOrders.find(po => po.id === poId), [productionOrders]);
  const getProductionOrdersBySku = useCallback((skuId: string) => productionOrders.filter(po => po.skuId === skuId), [productionOrders]);

  // Gerenciamento de Demanda
  const addDemand = useCallback(async (demandData: Omit<Demand, 'id' | 'createdAt'>) => {
    const newDemandId = uuidv4();
    const newDemand: Demand = { ...demandData, id: newDemandId, createdAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, DEMANDS_COLLECTION, newDemand.id), newDemand);
      setDemands(prev => [...prev, newDemand]);
    } catch (error: any) {
      console.error("Erro ao adicionar Demanda:", newDemand.id, error);
      toast({
        title: "Erro ao Adicionar Demanda",
        description: `Não foi possível adicionar a Demanda. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateDemand = useCallback(async (demandId: string, demandData: Partial<Omit<Demand, 'id' | 'createdAt'>>) => {
    try {
      const demandRef = doc(db, DEMANDS_COLLECTION, demandId);
      await updateDoc(demandRef, demandData);
      setDemands(prev => prev.map(d => d.id === demandId ? { ...d, ...demandData } as Demand : d));
    } catch (error: any) {
      console.error("Erro ao atualizar Demanda:", demandId, error);
      toast({
        title: "Erro ao Atualizar Demanda",
        description: `Não foi possível atualizar a Demanda. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteDemand = useCallback(async (demandId: string) => {
    try {
      await deleteDoc(doc(db, DEMANDS_COLLECTION, demandId));
      setDemands(prev => prev.filter(d => d.id !== demandId));
    } catch (error: any) {
      console.error("Erro ao excluir Demanda:", demandId, error);
       toast({
        title: "Erro ao Excluir Demanda",
        description: `Não foi possível excluir a Demanda. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteSelectedDemands = useCallback(async (demandIds: string[]) => {
    const batch = writeBatch(db);
    demandIds.forEach(id => batch.delete(doc(db, DEMANDS_COLLECTION, id)));
    try {
      await batch.commit();
      setDemands(prev => prev.filter(d => !demandIds.includes(d.id)));
    } catch (error: any) {
      console.error("Erro ao excluir Demandas em lote:", error);
      toast({
        title: "Erro ao Excluir Demandas",
        description: `Não foi possível excluir as Demandas selecionadas. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

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
    isDataReady: isMounted, // isDataReady agora reflete se o cliente montou e os dados podem ser considerados prontos
  }), [
    isMounted, skus, productionOrders, demands,
    addSku, updateSku, deleteSku, deleteSelectedSkus, findSkuById,
    addProductionOrder, updateProductionOrder, deleteProductionOrder, deleteSelectedProductionOrders, 
    startProductionOrderTimer, stopProductionOrderTimer, findProductionOrderById, getProductionOrdersBySku,
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
