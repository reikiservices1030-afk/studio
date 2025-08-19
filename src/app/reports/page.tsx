import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ReportsClient } from "./reports-client";

export default function ReportsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Rapports financiers">
        <Button size="sm" variant="outline" className="gap-1">
          <Download className="h-3.5 w-3.5" />
          Télécharger les rapports
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <ReportsClient />
      </div>
    </div>
  );
}
