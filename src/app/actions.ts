"use server";

import { improveProductionTimes } from '@/ai/flows/improve-production-times';
import type { ImproveProductionTimesInput, ImproveProductionTimesOutput } from '@/ai/flows/improve-production-times';
import type { ProductionDataEntry } from '@/types';

export async function getAIProductionAnalysis(
  entries: ProductionDataEntry[]
): Promise<ImproveProductionTimesOutput> {
  if (!entries || entries.length === 0) {
    return {
      analysis: "Nenhum dado de produção fornecido para análise.",
      suggestions: "Por favor, forneça dados de produção para obter sugestões de melhoria.",
    };
  }

  const productionDataString = entries
    .map(entry => `SKU: ${entry.skuCode}, Quantidade: ${entry.quantityProduced}, Tempo: ${entry.productionTimeMinutes} min`)
    .join('; ');

  const input: ImproveProductionTimesInput = {
    productionData: productionDataString,
  };

  try {
    const result = await improveProductionTimes(input);
    return result;
  } catch (error) {
    console.error("Error calling AI production analysis:", error);
    return {
      analysis: "Erro ao analisar os dados de produção.",
      suggestions: "Não foi possível obter sugestões de IA. Tente novamente mais tarde.",
    };
  }
}
