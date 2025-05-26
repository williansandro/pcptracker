
"use client";

import type React from 'react';
import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { SKU, ProductionOrder, Demand, ProductionOrderStatus, BreakEntry, BOMEntry } from '@/types';
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
  documentId,
  QuerySnapshot,
  DocumentData,
  getDoc, // Import getDoc
  FirestoreError
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';

const SKUS_COLLECTION = 'skus';
const PRODUCTION_ORDERS_COLLECTION = 'productionOrders';
const DEMANDS_COLLECTION = 'demands';


interface DeleteSelectedSkusResult {
  deletedCount: number;
  notDeleted: { code: string; reason: string }[];
}

interface AppContextType {
  skus: SKU[];
  addSku: (skuData: Omit<SKU, 'id' | 'createdAt' | 'components' | 'standardTimeSeconds' | 'assemblyTimeSeconds' > & { components?: Pick<BOMEntry, 'componentSkuId' | 'quantity'>[], standardTimeSeconds?: number, assemblyTimeSeconds?: number }) => Promise<boolean>;
  updateSku: (skuId: string, skuData: Partial<Omit<SKU, 'id' | 'createdAt'>>) => Promise<boolean>;
  deleteSku: (skuId: string) => Promise<void>;
  deleteSelectedSkus: (skuIds: string[]) => Promise<DeleteSelectedSkusResult>;
  findSkuById: (skuId: string) => SKU | undefined;

  productionOrders: ProductionOrder[];
  addProductionOrder: (poData: Omit<ProductionOrder, 'id' | 'createdAt' | 'status' | 'producedQuantity' | 'startTime' | 'endTime' | 'productionTime' | 'breaks'> & { breaks?: BreakEntry[] }) => Promise<void>;
  updateProductionOrder: (poId: string, poData: Partial<Omit<ProductionOrder, 'id' | 'createdAt'>>) => Promise<void>;
  deleteProductionOrder: (poId: string) => Promise<void>;
  deleteSelectedProductionOrders: (poIds: string[]) => Promise<void>;
  startProductionOrderTimer: (poId: string) => Promise<void>;
  stopProductionOrderTimer: (poId: string, producedQuantity: number, breaks?: BreakEntry[]) => Promise<void>;
  findProductionOrderById: (poId: string) => ProductionOrder | undefined;
  getProductionOrdersBySku: (skuId: string) => ProductionOrder[];

  demands: Demand[];
  addDemand: (demandData: Omit<Demand, 'id' | 'createdAt'>) => Promise<boolean>;
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
  const { currentUser, loading: authLoading } = useAuth();


  const mapDocToSku = useCallback((docData: DocumentData): SKU => ({
    id: docData.id,
    code: docData.code,
    description: docData.description,
    standardTimeSeconds: docData.standardTimeSeconds || 0,
    assemblyTimeSeconds: docData.assemblyTimeSeconds || 0,
    components: docData.components || [],
    createdAt: docData.createdAt,
  }), []);

  const mapDocToProductionOrder = useCallback((docData: DocumentData): ProductionOrder => ({
    ...docData,
    id: docData.id,
    breaks: docData.breaks || [],
  } as ProductionOrder), []);

  const mapDocToDemand = useCallback((docData: DocumentData): Demand => ({
    ...docData,
    id: docData.id,
  } as Demand), []);

  const seedDatabase = useCallback(async () => {
    console.log("Verificando necessidade de popular o banco de dados...");
    const skusCollectionRef = collection(db, SKUS_COLLECTION);
    const skusSnapshot = await getCountFromServer(skusCollectionRef);
  
    if (skusSnapshot.data().count === 0) {
      console.log("Populando SKUs...");
      const batchSkus = writeBatch(db);
      const skuCodeToIdMap: Record<string, string> = {};
      const skusParaProcessarBOM: Array<SKU & { tempComponents?: Array<{ componentSkuCode: string, quantity: number }> }> = [];
  
      for (const skuData of DUMMY_SKUS_DATA) {
        const newSkuId = uuidv4();
        const newSkuDoc: Omit<SKU, 'id' | 'createdAt' | 'components'> & { createdAt: string, components: BOMEntry[] } = {
          code: skuData.code,
          description: skuData.description,
          standardTimeSeconds: skuData.standardTimeSeconds || 0,
          assemblyTimeSeconds: skuData.assemblyTimeSeconds || 0,
          createdAt: new Date().toISOString(),
          components: [], // Inicializa como array vazio
        };
        
        skuCodeToIdMap[skuData.code] = newSkuId;
        const skuRef = doc(db, SKUS_COLLECTION, newSkuId);
        batchSkus.set(skuRef, newSkuDoc);
        
        // Armazena para processamento posterior da BOM
        skusParaProcessarBOM.push({
          ...newSkuDoc,
          id: newSkuId,
          // @ts-ignore Se skuData.components existir, armazena temporariamente
          tempComponents: skuData.components ? skuData.components.map(c => ({ componentSkuCode: c.componentSkuId, quantity: c.quantity })) : undefined,
        });
      }
      await batchSkus.commit();
      console.log("SKUs populados (fase 1):", skusParaProcessarBOM.length);
  
      // Fase 2: Processar BOMs
      const batchBOM = writeBatch(db);
      let bomUpdatesMade = false;
      const finalSeededSkus: SKU[] = [];
  
      for (const tempSku of skusParaProcessarBOM) {
        const finalSku: SKU = { 
          id: tempSku.id,
          code: tempSku.code,
          description: tempSku.description,
          standardTimeSeconds: tempSku.standardTimeSeconds,
          assemblyTimeSeconds: tempSku.assemblyTimeSeconds,
          createdAt: tempSku.createdAt,
          components: [] 
        };
  
        if (tempSku.tempComponents && tempSku.tempComponents.length > 0) {
          const mappedComponents: BOMEntry[] = tempSku.tempComponents
            .map(comp => {
              const componentId = skuCodeToIdMap[comp.componentSkuCode];
              if (componentId) {
                return { componentSkuId: componentId, quantity: comp.quantity };
              }
              console.warn(`[Seed] Componente SKU (código) ${comp.componentSkuCode} não encontrado para BOM do SKU ${tempSku.code}`);
              return null;
            })
            .filter(comp => comp !== null) as BOMEntry[];
  
          if (mappedComponents.length > 0) {
            finalSku.components = mappedComponents;
            const skuRef = doc(db, SKUS_COLLECTION, tempSku.id);
            batchBOM.update(skuRef, { components: mappedComponents });
            bomUpdatesMade = true;
          }
        }
        finalSeededSkus.push(finalSku);
      }
  
      if (bomUpdatesMade) {
        await batchBOM.commit();
        console.log("[Seed] Componentes BOM atualizados nos SKUs do Firestore.");
      }
  
      console.log("Populando Ordens de Produção...");
      const batchPOs = writeBatch(db);
      const seededPOs: ProductionOrder[] = [];
      DUMMY_PRODUCTION_ORDERS_DATA.forEach((poData, index) => {
        const skuForPoData = DUMMY_SKUS_DATA[index % DUMMY_SKUS_DATA.length];
        const skuIdForPo = skuCodeToIdMap[skuForPoData.code];

        if (!skuIdForPo) {
          console.warn("[Seed] SKU não encontrado para popular OP, pulando:", poData);
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
          skuId: skuIdForPo,
          status,
          targetQuantity: poData.targetQuantity,
          producedQuantity: status === 'Concluída' ? poData.producedQuantity : undefined,
          startTime: status === 'Em Progresso' || status === 'Concluída' ? poData.startTime : null,
          endTime: status === 'Concluída' ? poData.endTime : null,
          productionTime: status === 'Concluída' ? poData.productionTime : null,
          breaks: (poData.breaks || []).map(b => ({...b, id: b.id || uuidv4()})),
          createdAt: new Date(Date.now() - (DUMMY_PRODUCTION_ORDERS_DATA.length - index) * 10 * 60 * 1000).toISOString(),
        };
        const poRef = doc(db, PRODUCTION_ORDERS_COLLECTION, newPo.id);
        batchPOs.set(poRef, newPo);
        seededPOs.push(newPo);
      });
      await batchPOs.commit();
      console.log("[Seed] Ordens de Produção populadas:", seededPOs.length);

      console.log("Populando Demandas...");
      const batchDemands = writeBatch(db);
      const seededDemands: Demand[] = [];
      DUMMY_DEMANDS_DATA.forEach((demandData, index) => {
        const skuForDemandData = DUMMY_SKUS_DATA[index % DUMMY_SKUS_DATA.length];
        const skuIdForDemand = skuCodeToIdMap[skuForDemandData.code];

         if (!skuIdForDemand) {
          console.warn("[Seed] SKU não encontrado para popular Demanda, pulando:", demandData);
          return;
        }
        const newDemandId = uuidv4();
        const newDemand: Demand = {
          ...demandData,
          id: newDemandId,
          skuId: skuIdForDemand,
          createdAt: new Date().toISOString(),
        };
        const demandRef = doc(db, DEMANDS_COLLECTION, newDemand.id);
        batchDemands.set(demandRef, newDemand);
        seededDemands.push(newDemand);
      });
      await batchDemands.commit();
      console.log("[Seed] Demandas populadas:", seededDemands.length);
      console.log("Banco de dados populado com dados fictícios.");
      return { skus: finalSeededSkus, pos: seededPOs, demands: seededDemands };
    } else {
      console.log("Banco de dados já contém dados de SKUs.");
      return null;
    }
  }, [mapDocToSku, mapDocToProductionOrder, mapDocToDemand]);


  const fetchData = useCallback(async () => {
    if (!currentUser) {
      console.log("FetchData: Nenhum usuário logado, não buscando dados.");
      setSkus([]);
      setProductionOrders([]);
      setDemands([]);
      return;
    }
    try {
      console.log("Buscando dados do Firestore...");
      const seededData = await seedDatabase();

      if (seededData) {
        setSkus(seededData.skus.map(mapDocToSku).sort((a, b) => a.code.localeCompare(b.code)));
        setProductionOrders(seededData.pos.map(mapDocToProductionOrder).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setDemands(seededData.demands.map(mapDocToDemand).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        console.log("Dados do seeding aplicados ao estado local.");
      } else {
        const skusQuery = query(collection(db, SKUS_COLLECTION));
        const skusSnapshot = await getDocs(skusQuery);
        const skusData = skusSnapshot.docs.map(d => mapDocToSku({ id: d.id, ...d.data() }));
        setSkus(skusData.sort((a, b) => a.code.localeCompare(b.code)));
        console.log("SKUs carregados:", skusData.length);

        const posQuery = query(collection(db, PRODUCTION_ORDERS_COLLECTION));
        const posSnapshot = await getDocs(posQuery);
        const posData = posSnapshot.docs.map(d => mapDocToProductionOrder({ id: d.id, ...d.data() }));
        setProductionOrders(posData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        console.log("Ordens de Produção carregadas:", posData.length);

        const demandsQuery = query(collection(db, DEMANDS_COLLECTION));
        const demandsSnapshot = await getDocs(demandsQuery);
        const demandsData = demandsSnapshot.docs.map(d => mapDocToDemand({ id: d.id, ...d.data() }));
        setDemands(demandsData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        console.log("Demandas carregadas:", demandsData.length);
      }

    } catch (error: any) {
      console.error("Erro ao buscar dados do Firestore:", error);
      toast({
        title: "Erro de Conexão",
        description: `Não foi possível carregar os dados do banco. ${error.message}`,
        variant: "destructive",
      });
    }
  }, [currentUser, seedDatabase, toast, mapDocToSku, mapDocToProductionOrder, mapDocToDemand]);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !authLoading) {
      if (currentUser) {
        console.log("Usuário autenticado, buscando dados...");
        fetchData();
      } else {
        console.log("Nenhum usuário autenticado, limpando dados...");
        setSkus([]);
        setProductionOrders([]);
        setDemands([]);
      }
    }
  }, [isMounted, authLoading, currentUser, fetchData]);


  const addSku = useCallback(async (skuData: Omit<SKU, 'id' | 'createdAt' | 'components' | 'standardTimeSeconds' | 'assemblyTimeSeconds' > & { components?: Pick<BOMEntry, 'componentSkuId' | 'quantity'>[], standardTimeSeconds?: number, assemblyTimeSeconds?: number } ): Promise<boolean> => {
    const normalizedCode = skuData.code.toUpperCase();
    const q = query(collection(db, SKUS_COLLECTION), where("code", "==", normalizedCode));

    try {
      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      if (!querySnapshot.empty) {
        toast({
          title: "Erro ao Adicionar SKU",
          description: "Código de SKU já existente.",
          variant: "destructive",
        });
        return false;
      }

      const newSkuId = uuidv4();
      const newSku: SKU = {
        ...skuData, 
        standardTimeSeconds: skuData.standardTimeSeconds || 0,
        assemblyTimeSeconds: skuData.assemblyTimeSeconds || 0,
        components: skuData.components || [], 
        id: newSkuId,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, SKUS_COLLECTION, newSku.id), newSku);
      setSkus(prev => [...prev, newSku].sort((a, b) => a.code.localeCompare(b.code)));
      toast({ title: "SKU Adicionado", description: `SKU ${newSku.code} adicionado com sucesso.` });
      return true;
    } catch (error: any) {
      console.error("Erro na operação Firestore ao adicionar SKU:", error);
      toast({
        title: "Erro ao Adicionar SKU",
        description: (error as Error).message || "Não foi possível adicionar o SKU ao banco de dados.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const updateSku = useCallback(async (skuId: string, skuData: Partial<Omit<SKU, 'id' | 'createdAt'>>): Promise<boolean> => {
    console.log("[AppContext] updateSku - Received skuId:", skuId);
    console.log("[AppContext] updateSku - Received skuData:", JSON.stringify(skuData, null, 2));
    
    const skuRef = doc(db, SKUS_COLLECTION, skuId);
    
    // Construir o payload de atualização apenas com os campos fornecidos em skuData
    const updatePayload: Partial<SKU> = {};
    if (skuData.code !== undefined) updatePayload.code = skuData.code;
    if (skuData.description !== undefined) updatePayload.description = skuData.description;
    if (skuData.standardTimeSeconds !== undefined) updatePayload.standardTimeSeconds = skuData.standardTimeSeconds;
    if (skuData.assemblyTimeSeconds !== undefined) updatePayload.assemblyTimeSeconds = skuData.assemblyTimeSeconds;
    if (skuData.components !== undefined) updatePayload.components = skuData.components; // Pode ser um array vazio para limpar

    console.log("[AppContext] updateSku - Sending updatePayload:", JSON.stringify(updatePayload, null, 2));

    if (Object.keys(updatePayload).length === 0) {
      console.log("[AppContext] updateSku - No fields to update for SKU:", skuId);
      toast({ title: "Nenhuma Alteração", description: "Nenhuma alteração foi detectada para o SKU." });
      return true; // Nenhuma alteração, mas não é um erro
    }
    
    try {
      await updateDoc(skuRef, updatePayload);
  
      setSkus(prevSkus =>
        prevSkus.map(s =>
          s.id === skuId ? { ...s, ...updatePayload } as SKU : s
        ).sort((a, b) => a.code.localeCompare(b.code))
      );
  
      const currentSku = skus.find(s => s.id === skuId); // Pode pegar o estado antes da atualização para o nome no toast
      toast({ title: "SKU Atualizado", description: `SKU ${updatePayload.code || currentSku?.code} atualizado.`});
      return true;
    } catch (error: any) {
      const firestoreError = error as FirestoreError;
      if (firestoreError.code === 'not-found') {
        toast({
          title: "Erro: SKU Não Encontrado",
          description: "Este SKU não foi encontrado no banco de dados. A atualização falhou.",
          variant: "destructive",
        });
      } else {
        console.error("Erro ao atualizar SKU:", skuId, error);
        toast({
          title: "Erro ao Atualizar SKU",
          description: (error as Error).message || "Não foi possível atualizar o SKU.",
          variant: "destructive",
        });
      }
      return false;
    }
  }, [toast, skus]);
  
  const deleteSku = useCallback(async (skuId: string) => {
    const skuToDelete = skus.find(s => s.id === skuId);
    if (!skuToDelete) {
        toast({ title: "Erro Interno", description: "SKU não encontrado para exclusão.", variant: "destructive" });
        throw new Error("SKU não encontrado para exclusão.");
    }

    const posQuery = query(collection(db, PRODUCTION_ORDERS_COLLECTION), where("skuId", "==", skuId));
    const demandsQuery = query(collection(db, DEMANDS_COLLECTION), where("skuId", "==", skuId));

    try {
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
        toast({ title: "Falha na Exclusão", description: errorMessage, variant: "destructive" });
        throw new Error(errorMessage);
      }

      await deleteDoc(doc(db, SKUS_COLLECTION, skuId));
      setSkus(prev => prev.filter(s => s.id !== skuId));
      toast({ title: "SKU Excluído", description: `SKU ${skuToDelete.code} excluído com sucesso.` });
    } catch (error: any) {
      if (!(error instanceof Error && error.message.startsWith("O SKU"))) {
        toast({
          title: "Erro ao Excluir SKU",
          description: (error as Error).message || "Não foi possível excluir o SKU.",
          variant: "destructive",
        });
      }
      throw error; 
    }
  }, [skus, toast]);

  const deleteSelectedSkus = useCallback(async (skuIds: string[]): Promise<DeleteSelectedSkusResult> => {
    const skusToDeleteCompletely: string[] = [];
    const skusNotDeletedInfo: { code: string; reason: string }[] = [];
    const batch = writeBatch(db);

    for (const skuId of skuIds) {
      const sku = skus.find(s => s.id === skuId);
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
        skusNotDeletedInfo.push({ code: sku.code, reason: reasons.join(' e ') });
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
         const tempNotDeleted = [...skusNotDeletedInfo];
         skusToDeleteCompletely.forEach(id => {
            const skuFound = skus.find(s => s.id === id);
            if(skuFound && !tempNotDeleted.find(nd => nd.code === skuFound.code)) {
                 tempNotDeleted.push({code: skuFound.code, reason: "Erro no servidor durante exclusão"});
            }
         });
         return { deletedCount: 0, notDeleted: tempNotDeleted };
      }
    }

    return {
      deletedCount: skusToDeleteCompletely.length,
      notDeleted: skusNotDeletedInfo,
    };
  }, [skus]);

  const findSkuById = useCallback((skuId: string) => skus.find(s => s.id === skuId), [skus]);

  const addProductionOrder = useCallback(async (poData: Omit<ProductionOrder, 'id' | 'createdAt' | 'status' | 'producedQuantity' | 'startTime' | 'endTime' | 'productionTime' | 'breaks'> & { breaks?: BreakEntry[] }) => {
    const newPoId = uuidv4();
    const newPo: ProductionOrder = {
      ...poData,
      id: newPoId,
      status: 'Aberta',
      breaks: (poData.breaks || []).map(b => ({...b, id: b.id || uuidv4()})),
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, PRODUCTION_ORDERS_COLLECTION, newPo.id), newPo);
      setProductionOrders(prev => [...prev, newPo].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      toast({ title: "Ordem de Produção Adicionada", description: "Nova OP criada com sucesso." });
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
      let updateData: Partial<ProductionOrder> = { ...poData };
  
      // Assegurar que breaks seja um array com IDs
      if (updateData.breaks) {
        updateData.breaks = updateData.breaks.map(b => ({...b, id: b.id || uuidv4()}));
      }
  
      if (poData.status === 'Concluída' && poData.startTime && poData.endTime) {
        const startTimeMs = new Date(poData.startTime).getTime();
        const endTimeMs = new Date(poData.endTime).getTime();
        if (endTimeMs >= startTimeMs) {
          let calculatedProductionTimeSeconds = Math.floor((endTimeMs - startTimeMs) / 1000);
          const totalBreaksDurationSeconds = (updateData.breaks || []).reduce((acc, itemBreak) => acc + (itemBreak.durationMinutes * 60), 0);
          calculatedProductionTimeSeconds -= totalBreaksDurationSeconds;
          updateData.productionTime = calculatedProductionTimeSeconds;
        } else {
          updateData.productionTime = null; 
        }
      } else if (poData.status === 'Em Progresso') {
        updateData.endTime = null;
        updateData.productionTime = null;
      }
  
      const finalUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== undefined) { 
          (acc as any)[key as keyof typeof updateData] = value;
        }
        return acc;
      }, {} as Partial<ProductionOrder>);
  
      if (Object.keys(finalUpdateData).length > 0) {
        await updateDoc(poRef, finalUpdateData);
      }
  
      setProductionOrders(prev =>
        prev.map(po => po.id === poId ? { ...po, ...finalUpdateData } as ProductionOrder : po)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
       toast({ title: "Ordem de Produção Atualizada", description: `OP ${poId.substring(0,8)} atualizada.`});
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
      toast({ title: "Ordem de Produção Excluída", description: `OP ${poId.substring(0,8)} excluída.`});
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
      toast({ title: "OPs Excluídas", description: `${poIds.length} ordem(ns) de produção excluída(s).`});
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
    if (!poToUpdate) {
      toast({ title: "Erro", description: "Ordem de Produção não encontrada.", variant: "destructive" });
      return;
    }
    if (poToUpdate?.status !== 'Aberta') {
        toast({ title: "Ação Inválida", description: "Só é possível iniciar OPs com status 'Aberta'.", variant: "default" });
        return;
    }
    const updateData = {
      status: 'Em Progresso' as ProductionOrderStatus,
      startTime: new Date().toISOString(),
      endTime: null, 
      productionTime: null, 
      breaks: (poToUpdate.breaks || []).map(b => ({...b, id: b.id || uuidv4()})),
    };
    try {
      const poRef = doc(db, PRODUCTION_ORDERS_COLLECTION, poId);
      await updateDoc(poRef, updateData);
      setProductionOrders(prev => prev.map(po =>
        po.id === poId ? { ...po, ...updateData } as ProductionOrder : po
      ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error: any) {
      console.error("Erro ao iniciar timer da OP:", poId, error);
       toast({
        title: "Erro ao Iniciar Timer",
        description: `Não foi possível iniciar o timer da OP. ${(error as Error).message}`,
        variant: "destructive",
      });
       throw error; 
    }
  }, [productionOrders, toast]);

  const stopProductionOrderTimer = useCallback(async (poId: string, producedQuantity: number, breaks?: BreakEntry[]) => {
    const poToUpdate = productionOrders.find(po => po.id === poId);
    if (poToUpdate && poToUpdate.status === 'Em Progresso' && poToUpdate.startTime) {
      const endTime = new Date();
      let productionTimeSeconds = Math.floor((endTime.getTime() - new Date(poToUpdate.startTime).getTime()) / 1000);
      
      const finalBreaks = (breaks || []).map(b => ({...b, id: b.id || uuidv4()}));
      const totalBreaksDurationSeconds = finalBreaks.reduce((acc, itemBreak) => acc + (itemBreak.durationMinutes * 60), 0);
      productionTimeSeconds -= totalBreaksDurationSeconds;
      // Não impedir que productionTimeSeconds seja negativo
      
      const updateData = {
        status: 'Concluída' as ProductionOrderStatus,
        endTime: endTime.toISOString(),
        productionTime: productionTimeSeconds,
        producedQuantity,
        breaks: finalBreaks,
      };
      try {
        const poRef = doc(db, PRODUCTION_ORDERS_COLLECTION, poId);
        await updateDoc(poRef, updateData);
        setProductionOrders(prev => prev.map(po => po.id === poId ? { ...po, ...updateData } as ProductionOrder : po)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error: any) {
        console.error("Erro ao parar timer da OP:", poId, error);
        toast({
            title: "Erro ao Finalizar OP",
            description: `Não foi possível finalizar a OP e parar o timer. ${(error as Error).message}`,
            variant: "destructive",
        });
        throw error; 
      }
    } else {
        console.warn("Tentativa de parar timer para OP não elegível:", poId, poToUpdate?.status);
        toast({ title: "Ação Inválida", description: "Não foi possível finalizar esta OP. Verifique seu status.", variant: "default"});
        throw new Error("Ação Inválida: Não foi possível finalizar esta OP.");
    }
  }, [productionOrders, toast]);

  const findProductionOrderById = useCallback((poId: string) => productionOrders.find(po => po.id === poId), [productionOrders]);
  const getProductionOrdersBySku = useCallback((skuId: string) => productionOrders.filter(po => po.skuId === skuId), [productionOrders]);

  const addDemand = useCallback(async (demandData: Omit<Demand, 'id' | 'createdAt'>): Promise<boolean> => {
    const existingDemand = demands.find(d => d.skuId === demandData.skuId && d.monthYear === demandData.monthYear);
    if (existingDemand) {
      toast({
        title: "Demanda Duplicada",
        description: `Já existe uma demanda para este SKU no mês ${demandData.monthYear}.`,
        variant: "destructive",
      });
      return false;
    }

    const newDemandId = uuidv4();
    const newDemand: Demand = { ...demandData, id: newDemandId, createdAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, DEMANDS_COLLECTION, newDemand.id), newDemand);
      setDemands(prev => [...prev, newDemand].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      toast({ title: "Demanda Adicionada", description: "Nova demanda mensal adicionada."});
      return true;
    } catch (error: any) {
      console.error("Erro ao adicionar Demanda:", newDemand.id, error);
      toast({
        title: "Erro ao Adicionar Demanda",
        description: `Não foi possível adicionar a Demanda. ${(error as Error).message}`,
        variant: "destructive",
      });
      return false;
    }
  }, [demands, toast]);

  const updateDemand = useCallback(async (demandId: string, demandData: Partial<Omit<Demand, 'id' | 'createdAt'>>) => {
    const demandToUpdate = demands.find(d => d.id === demandId);
    if (!demandToUpdate) {
      toast({ title: "Erro", description: "Demanda não encontrada para atualização.", variant: "destructive" });
      return;
    }

    const newSkuId = demandData.skuId || demandToUpdate.skuId;
    const newMonthYear = demandData.monthYear || demandToUpdate.monthYear;
    
    if (demandData.skuId || demandData.monthYear) { 
        const existingDemand = demands.find(d => d.id !== demandId && d.skuId === newSkuId && d.monthYear === newMonthYear);
        if (existingDemand) {
            const skuCode = skus.find(s => s.id === newSkuId)?.code || 'N/D';
            toast({
                title: "Demanda Duplicada",
                description: `Já existe uma demanda para o SKU ${skuCode} no mês ${newMonthYear}.`,
                variant: "destructive",
            });
            return;
        }
    }

    try {
      const demandRef = doc(db, DEMANDS_COLLECTION, demandId);
      const updatePayload = Object.entries(demandData).reduce((acc, [key, value]) => {
        if (value !== undefined) { 
          (acc as any)[key as keyof typeof demandData] = value;
        }
        return acc;
      }, {} as Partial<Demand>);

      if (Object.keys(updatePayload).length > 0) {
        await updateDoc(demandRef, updatePayload);
      }
      setDemands(prev => prev.map(d => d.id === demandId ? { ...d, ...updatePayload } as Demand : d)
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      toast({ title: "Demanda Atualizada", description: `Demanda atualizada.`});
    } catch (error: any) {
      console.error("Erro ao atualizar Demanda:", demandId, error);
      toast({
        title: "Erro ao Atualizar Demanda",
        description: `Não foi possível atualizar a Demanda. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [demands, skus, toast]);

  const deleteDemand = useCallback(async (demandId: string) => {
    try {
      await deleteDoc(doc(db, DEMANDS_COLLECTION, demandId));
      setDemands(prev => prev.filter(d => d.id !== demandId));
      toast({ title: "Demanda Excluída", description: `Demanda excluída.`});
    } catch (error: any) {
      console.error("Erro ao excluir Demanda:", demandId, error);
       toast({
        title: "Erro ao Excluir Demanda",
        description: `Não foi possível excluir a Demanda. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [toast, demands]); 

  const deleteSelectedDemands = useCallback(async (demandIds: string[]) => {
    const batch = writeBatch(db);
    demandIds.forEach(id => batch.delete(doc(db, DEMANDS_COLLECTION, id)));
    try {
      await batch.commit();
      setDemands(prev => prev.filter(d => !demandIds.includes(d.id)));
      toast({ title: "Demandas Excluídas", description: `${demandIds.length} demanda(s) excluída(s).`});
    } catch (error: any) {
      console.error("Erro ao excluir Demandas em lote:", error);
      toast({
        title: "Erro ao Excluir Demandas",
        description: `Não foi possível excluir as Demandas selecionadas. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [toast, demands]); 

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
    isDataReady: isMounted && !authLoading && !!currentUser,
  }), [
    isMounted, authLoading, currentUser,
    skus, productionOrders, demands,
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
