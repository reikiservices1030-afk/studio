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
    // In a real app, you'd want to log this error more robustly.
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to analyze market data: ${errorMessage}` };
  }
}

export default function AnalysisPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Rental Market Analysis" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <AnalysisClient runAnalysis={runAnalysis} />
      </div>
    </div>
  );
}
