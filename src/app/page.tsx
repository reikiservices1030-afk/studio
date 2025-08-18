import { Header } from '@/components/layout/Header';
import { DashboardClient } from './dashboard-client';

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <DashboardClient />
      </div>
    </div>
  );
}
