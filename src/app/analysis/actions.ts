'use server';

import type { AnalyzeRentalMarketInput } from '@/ai/flows/analyze-rental-market';
import { analyzeRentalMarket } from '@/ai/flows/analyze-rental-market';

export async function runAnalysis(data: AnalyzeRentalMarketInput) {
  try {
    const result = await analyzeRentalMarket(data);
    return { success: true, data: result };
  } catch (e) {
    console.error(e);
    // Dans une vraie application, vous voudriez logger cette erreur de manière plus robuste.
    const errorMessage = e instanceof Error ? e.message : 'Une erreur inconnue est survenue.';
    return { success: false, error: `Échec de l'analyse des données du marché : ${errorMessage}` };
  }
}
