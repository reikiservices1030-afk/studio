import { Header } from '@/components/layout/Header';
import { AnalysisClient } from './analysis-client';
import { runAnalysis } from './actions';

export default async function AnalysisPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Analyse du marché locatif" />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AnalysisClient runAnalysis={runAnalysis} />
      </div>
    </div>
  );
}
