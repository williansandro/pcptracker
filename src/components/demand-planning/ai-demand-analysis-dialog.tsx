
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
import type { SKU, DemandDataEntry, AnalyzeDemandForecastOutput } from '@/types';
import { getAIDemandAnalysis } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface AiDemandAnalysisDialogProps {
  demandData: { monthYear: string; targetQuantity: number; producedQuantity: number }[];
  sku: SKU;
}

export function AiDemandAnalysisDialog({ demandData, sku }: AiDemandAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDemandForecastOutput | null>(null);
  const { toast } = useToast();

  const handleFetchAnalysis = async () => {
    setIsLoading(true);
    setAnalysisResult(null);

    if (demandData.length === 0) {
      toast({
        title: "Dados Insuficientes",
        description: `Não há dados históricos de demanda suficientes para o SKU ${sku.code} para análise.`,
        variant: "default",
      });
      setIsLoading(false);
      return;
    }

    // Formatar os dados para o formato esperado pela action
    const formattedDemandData: DemandDataEntry[] = demandData.map(d => ({
      skuCode: sku.code,
      skuDescription: sku.description,
      monthYear: d.monthYear,
      targetQuantity: d.targetQuantity,
      producedQuantity: d.producedQuantity,
    }));
    
    try {
      const result = await getAIDemandAnalysis(formattedDemandData);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Erro na Análise de Demanda com IA:", error);
      toast({
        title: "Erro na Análise",
        description: "Não foi possível obter a análise da IA para a demanda.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !analysisResult && !isLoading) {
      handleFetchAnalysis();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start text-left px-2 py-1.5 h-auto">
          <Brain className="mr-2 h-4 w-4" /> Analisar Demanda com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Análise de IA para Demanda: {sku.code}</DialogTitle>
          <DialogDescription>
            Análise da precisão do planejamento e sugestões para otimizar metas futuras.
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
                <h3 className="font-semibold mb-1">Análise da IA:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.analysis}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Sugestões da IA:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.suggestions}</p>
              </div>
            </>
          )}
          {!isLoading && !analysisResult && (
             <p className="text-sm text-center text-muted-foreground p-4">A análise da IA será carregada aqui.</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => setOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
