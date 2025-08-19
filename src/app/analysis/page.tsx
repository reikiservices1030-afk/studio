'use server';

import type { AnalyzeRentalMarketInput } from '@/ai/flows/analyze-rental-market';
import { analyzeRentalMarket } from '@/ai/flows/analyze-rental-market';
import { Header } from '@/components/layout/Header';
import { AnalysisClient } from './analysis-client';

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

export default async function AnalysisPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Analyse du marché locatif" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <AnalysisClient runAnalysis={runAnalysis} />
      </div>
    </div>
  );
}
