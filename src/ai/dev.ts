
import { config } from 'dotenv';
config(); // Carrega variáveis de .env e .env.local para process.env

// Log para verificar se a API key está carregada no processo do Genkit dev server
const apiKey = process.env.GOOGLE_API_KEY;
if (apiKey) {
  console.log('[Genkit Dev] GOOGLE_API_KEY carregada:', apiKey.substring(0, 5) + '...');
} else {
  console.warn('[Genkit Dev] ATENÇÃO: GOOGLE_API_KEY não encontrada nas variáveis de ambiente. A IA generativa não funcionará.');
}

import '@/ai/flows/improve-production-times.ts';
