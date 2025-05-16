
// 'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing production data and identifying areas for improvement.
 *
 * - improveProductionTimes - A function that analyzes production data and suggests improvements.
 * - ImproveProductionTimesInput - The input type for the improveProductionTimes function.
 * - ImproveProductionTimesOutput - The return type for the improveProductionTimes function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveProductionTimesInputSchema = z.object({
  productionData: z
    .string()
    .describe(
      'A string containing production data from completed work orders, including SKU, quantity produced, and production time.'
    ),
});
export type ImproveProductionTimesInput = z.infer<typeof ImproveProductionTimesInputSchema>;

const ImproveProductionTimesOutputSchema = z.object({
  analysis: z
    .string()
    .describe(
      'Uma análise dos dados de produção, identificando gargalos e áreas para melhoria. A resposta deve ser em Português do Brasil.'
    ),
  suggestions: z
    .string()
    .describe(
      'Sugestões específicas e acionáveis para otimizar os processos de fabricação e reduzir o tempo total de produção. A resposta deve ser em Português do Brasil.'
    ),
});
export type ImproveProductionTimesOutput = z.infer<typeof ImproveProductionTimesOutputSchema>;

export async function improveProductionTimes(
  input: ImproveProductionTimesInput
): Promise<ImproveProductionTimesOutput> {
  return improveProductionTimesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveProductionTimesPrompt',
  input: {schema: ImproveProductionTimesInputSchema},
  output: {schema: ImproveProductionTimesOutputSchema},
  prompt: `Você é um especialista em eficiência de manufatura. Analise os seguintes dados de produção para identificar gargalos e sugerir melhorias.

Dados de Produção:
{{{productionData}}}

Forneça uma análise dos dados e sugestões específicas e acionáveis para otimizar os processos de fabricação e reduzir o tempo total de produção.

Sua resposta DEVE ser em Português do Brasil.

Formate sua resposta no seguinte formato JSON:
{
  "analysis": "...",
  "suggestions": "..."
}`,
});

const improveProductionTimesFlow = ai.defineFlow(
  {
    name: 'improveProductionTimesFlow',
    inputSchema: ImproveProductionTimesInputSchema,
    outputSchema: ImproveProductionTimesOutputSchema,
  },
  async input => {
    try {
      const llmResponse = await prompt(input);
      if (!llmResponse.output) {
        console.error(
          "Genkit flow 'improveProductionTimesFlow' recebeu uma saída nula ou inválida do LLM. Resposta completa:",
          JSON.stringify(llmResponse, null, 2)
        );
        throw new Error(
          'A IA não conseguiu processar os dados no formato esperado.'
        );
      }
      return llmResponse.output;
    } catch (error) {
      console.error("Erro detalhado no fluxo 'improveProductionTimesFlow':", error);
      // Re-lançar o erro para que a Server Action possa pegá-lo e retornar uma mensagem apropriada.
      // Ou podemos retornar um objeto de erro estruturado aqui se preferirmos.
      throw new Error(
        `Falha ao executar o fluxo de análise da IA: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

