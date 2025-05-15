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
      'An analysis of the production data, identifying bottlenecks and areas for improvement.'
    ),
  suggestions: z
    .string()
    .describe(
      'Specific, actionable suggestions for optimizing manufacturing processes and reducing overall production time.'
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
  prompt: `You are a manufacturing efficiency expert. Analyze the following production data to identify bottlenecks and suggest improvements.

Production Data:
{{{productionData}}}

Provide an analysis of the data and specific, actionable suggestions for optimizing manufacturing processes and reducing overall production time.

Output your response in the following JSON format:
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
    const {output} = await prompt(input);
    return output!;
  }
);
