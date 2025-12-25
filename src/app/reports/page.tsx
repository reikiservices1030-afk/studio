'use client';

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { ReportsClient } from "./reports-client";
import { getReportsData, type ReportsData } from "./actions";
import { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from "@/hooks/use-toast";

export default function ReportsPage() {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getReportsData();
      setReportsData(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleDownload = () => {
    if (!reportsData) return;
    setIsDownloading(true);
    try {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Rapport Financier Annuel", 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Date du rapport: ${new Date().toLocaleDateString('fr-BE')}`, 14, 30);

        doc.autoTable({
            startY: 40,
            theme: 'grid',
            head: [['Indicateur', 'Valeur']],
            body: [
                ['Revenu total', `${reportsData.totalRevenue.toLocaleString('fr-BE')} €`],
                ['Dépenses totales', `${reportsData.totalExpenses.toLocaleString('fr-BE')} €`],
                ['Bénéfice net', `${reportsData.netProfit.toLocaleString('fr-BE')} €`],
                ['Marge bénéficiaire', `${reportsData.profitMargin.toFixed(1)}%`],
            ],
            headStyles: { fillColor: [41, 128, 185] },
        });

        const finalY = (doc as any).lastAutoTable.finalY;
        doc.text("Performance Mensuelle", 14, finalY + 15);

        doc.autoTable({
            startY: finalY + 20,
            head: [['Mois', 'Revenus', 'Dépenses']],
            body: reportsData.financialData.map(d => [d.month, `${d.income.toLocaleString('fr-BE')} €`, `${d.expenses.toLocaleString('fr-BE')} €`]),
            headStyles: { fillColor: [41, 128, 185] },
        });
        
        const finalY2 = (doc as any).lastAutoTable.finalY;
        doc.text("Transactions Récentes", 14, finalY2 + 15);

        doc.autoTable({
            startY: finalY2 + 20,
            head: [['Date', 'Description', 'Type', 'Montant']],
            body: reportsData.transactions.map(t => [t.date, t.description, t.type, `${t.type === 'Dépense' ? '-' : ''}${t.amount.toLocaleString('fr-BE')} €`]),
            headStyles: { fillColor: [41, 128, 185] },
        });

        doc.save(`Rapport-Financier-${new Date().toISOString().split('T')[0]}.pdf`);
        toast({ title: 'Succès', description: 'Rapport téléchargé en PDF.' });
    } catch(e) {
        console.error("Error generating PDF report:", e);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de générer le rapport PDF.' });
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Rapports financiers">
        <Button size="sm" variant="outline" className="gap-1" onClick={handleDownload} disabled={!reportsData || isDownloading}>
            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {isDownloading ? 'Téléchargement...' : 'Télécharger le rapport'}
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {loading || !reportsData ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ReportsClient data={reportsData} />
        )}
      </div>
    </div>
  );
}
