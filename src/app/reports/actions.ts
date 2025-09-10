
'use server';

import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import type { Payment, Maintenance } from '@/types';

type Transaction = {
  id: string;
  date: string;
  description: string;
  type: 'Revenu' | 'Dépense';
  amount: number;
};

type MonthlyData = {
  month: string;
  income: number;
  expenses: number;
};

export type ReportsData = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  financialData: MonthlyData[];
  transactions: Transaction[];
};

const getDefaultData = (): ReportsData => ({
  totalRevenue: 0,
  totalExpenses: 0,
  netProfit: 0,
  profitMargin: 0,
  financialData: [],
  transactions: [],
});

export async function getReportsData(): Promise<ReportsData> {
  try {
    const [paymentsSnap, maintenancesSnap] = await Promise.all([
      get(ref(db, 'payments')),
      get(ref(db, 'maintenances')),
    ]);

    const paymentsData = paymentsSnap.val() || {};
    const maintenancesData = maintenancesSnap.val() || {};

    const payments: Payment[] = Object.entries(paymentsData).map(([id, data]) => ({ id, ...(data as Omit<Payment, 'id'>) }));
    const maintenances: Maintenance[] = Object.entries(maintenancesData).map(([id, data]) => ({ id, ...(data as Omit<Maintenance, 'id'>) }));
    
    // 1. Calculate totals
    const totalRevenue = payments
      .filter(p => p.status === 'Payé')
      .reduce((acc, p) => acc + p.amount, 0);
    
    const totalExpenses = maintenances.reduce((acc, m) => acc + m.cost, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 2. Prepare monthly data for chart
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    const monthLabels: string[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1); // Avoid issues with end of month
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('fr-BE', { month: 'short' });
      monthlyMap.set(monthKey, { income: 0, expenses: 0 });
      monthLabels.push(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1).replace('.', ''));
    }

    payments.forEach(p => {
      if (p.status === 'Payé' && p.date) {
        const paymentDate = new Date(p.date);
        const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap.has(monthKey)) {
          monthlyMap.get(monthKey)!.income += p.amount;
        }
      }
    });

    maintenances.forEach(m => {
      if (m.date) {
        const maintenanceDate = new Date(m.date);
        const monthKey = `${maintenanceDate.getFullYear()}-${String(maintenanceDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap.has(monthKey)) {
          monthlyMap.get(monthKey)!.expenses += m.cost;
        }
      }
    });

    const financialData = Array.from(monthlyMap.values()).map((data, index) => ({
      month: monthLabels[index] || 'N/A',
      ...data
    }));
    
    // 3. Prepare transactions list
    const paymentTransactions: Transaction[] = payments
      .filter(p => p.status === 'Payé')
      .map(p => ({
        id: `p-${p.id}`,
        date: p.date,
        description: `Loyer ${p.period} - ${p.tenantFirstName} ${p.tenantLastName}`,
        type: 'Revenu',
        amount: p.amount,
      }));

    const maintenanceTransactions: Transaction[] = maintenances.map(m => ({
        id: `m-${m.id}`,
        date: m.date,
        description: m.description,
        type: 'Dépense',
        amount: m.cost
    }));

    const transactions = [...paymentTransactions, ...maintenanceTransactions]
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10); // Limit to 10 most recent transactions

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      financialData,
      transactions,
    };
  } catch (error) {
    console.error("Error fetching reports data:", error);
    return getDefaultData();
  }
}
