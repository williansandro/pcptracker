
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Brain, Loader2 } from 'lucide-react';
import type { ProductionOrder, SKU, ProductionDataEntry } from '@/types';
import { getAIProductionAnalysis } from '@/app/actions';
// import { useAppContext } from '@/contexts/app-context'; // Não usado diretamente
import { useToast } from '@/hooks/use-toast';

interface AiAnalysisDialogProps {
  productionOrdersForSku: ProductionOrder[]; 
  sku: SKU;
}

export function AiAnalysisDialog({ productionOrdersForSku, sku }: AiAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ analysis: string, suggestions: string } | null>(null);
  const { toast } = useToast();

  const handleFetchAnalysis = async () => {
    setIsLoading(true);
    setAnalysisResult(null);

    const productionData: ProductionDataEntry[] = productionOrdersForSku
      .filter(po => po.status === 'Concluída' && po.productionTime && po.productionTime > 0 && typeof po.producedQuantity === 'number')
      .map(po => ({
        skuCode: sku.code,
        quantityProduced: po.producedQuantity!, // Corrigido: Usar po.producedQuantity
        productionTimeMinutes: Math.round(po.productionTime! / 60), // productionTime é em segundos
      }));

    if (productionData.length === 0) {
      toast({
        title: "Dados Insuficientes",
        description: `Não há dados de produção concluídos suficientes para o SKU ${sku.code} para análise.`,
        variant: "default",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await getAIProductionAnalysis(productionData);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Erro na Análise de IA:", error);
      toast({
        title: "Erro na Análise",
        description: "Não foi possível obter a análise da IA.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !analysisResult && !isLoading) { // Fetch analysis when dialog opens, if not already fetched/loading
      handleFetchAnalysis();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {/* O evento onClick foi movido para handleOpenChange para melhor controle */}
        <Button variant="outline" size="sm" className="w-full justify-start text-left px-2 py-1.5 h-auto text-foreground hover:bg-accent/10"> 
          <Brain className="mr-2 h-4 w-4" /> Analisar com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>Análise de IA para SKU: {sku.code}</DialogTitle>
          <DialogDescription>
            Sugestões para otimizar o tempo de produção com base nos dados históricos.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Analisando dados...</p>
            </div>
          )}
          {analysisResult && !isLoading && (
            <>
              <div>
                <h3 className="font-semibold mb-1">Análise:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.analysis}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Sugestões:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.suggestions}</p>
              </div>
            </>
          )}
          {!isLoading && !analysisResult && (
             <p className="text-sm text-center text-muted-foreground p-4">A análise da IA será carregada aqui.</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
