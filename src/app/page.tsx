
'use server';

import { Header } from '@/components/layout/Header';
import { DashboardClient } from './dashboard-client';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import type { Payment, Property, Tenant, Reminder } from '@/types';

type DashboardData = {
  totalRevenue: number;
  occupancyRate: number;
  upcomingPaymentsCount: number;
  openIssuesCount: number;
  monthlyRevenue: { month: string; revenue: number }[];
  recentActivity: { id: string; tenant: string; activity: string; status: string }[];
};

async function getDashboardData(): Promise<DashboardData> {
  try {
    // Fetch all necessary data in parallel
    const [propertiesSnap, tenantsSnap, paymentsSnap, remindersSnap] = await Promise.all([
      get(ref(db, 'properties')),
      get(ref(db, 'tenants')),
      get(ref(db, 'payments')),
      get(ref(db, 'reminders'))
    ]);

    const propertiesData = propertiesSnap.val() || {};
    const tenantsData = tenantsSnap.val() || {};
    const paymentsData = paymentsSnap.val() || {};
    const remindersData = remindersSnap.val() || {};
    
    const properties: Property[] = Object.entries(propertiesData).map(([id, data]) => ({ id, ...(data as Omit<Property, 'id'>) }));
    const tenants: Tenant[] = Object.entries(tenantsData).map(([id, data]) => ({ id, ...(data as Omit<Tenant, 'id'>) }));
    const payments: Payment[] = Object.entries(paymentsData).map(([id, data]) => ({ id, ...(data as Omit<Payment, 'id'>) }));
    const reminders: Reminder[] = Object.entries(remindersData).map(([id, data]) => ({ id, ...(data as Omit<Reminder, 'id'>) }));

    // 1. Total Revenue
    const totalRevenue = payments.reduce((acc, payment) => acc + (payment.status === 'Payé' ? payment.amount : 0), 0);

    // 2. Occupancy Rate
    const totalProperties = properties.length;
    const occupiedProperties = tenants.filter(t => t.status === 'Actif' && t.propertyId).length;
    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;
    
    // 3. Upcoming Payments Count (reminders due in next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingPaymentsCount = reminders.filter(r => {
        if (!r.dueDate) return false;
        const dueDate = new Date(r.dueDate);
        return r.status !== 'Envoyé' && dueDate >= now && dueDate <= nextWeek;
    }).length;

    // 4. Open Issues (pending reminders)
    const openIssuesCount = reminders.filter(r => r.status === 'Programmé' || r.status === 'En attente').length;

    // 5. Monthly Revenue for the last 6 months
    const monthlyRevenueMap = new Map<string, number>();
    const monthLabels: string[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleString('fr-BE', { month: 'short' });
        monthlyRevenueMap.set(monthKey, 0);
        monthLabels.push(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1).replace('.', ''));
    }

    payments.forEach(p => {
        if (p.status === 'Payé' && p.date) {
            const paymentDate = new Date(p.date);
            const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyRevenueMap.has(monthKey)) {
                monthlyRevenueMap.set(monthKey, monthlyRevenueMap.get(monthKey)! + p.amount);
            }
        }
    });
    
    const monthlyRevenue = Array.from(monthlyRevenueMap.entries()).map(([key, revenue], index) => ({
      month: monthLabels[index] || 'N/A',
      revenue,
    }));


    // 6. Recent Activity (last 4 payments)
    const recentActivity = payments
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
      .map(p => ({
        id: p.id,
        tenant: `${p.tenantFirstName} ${p.tenantLastName}`,
        activity: `Loyer payé (${p.period})`,
        status: p.status,
      }));

    return {
      totalRevenue,
      occupancyRate,
      upcomingPaymentsCount,
      openIssuesCount,
      monthlyRevenue,
      recentActivity,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return default/empty data on error to avoid crashing the page
    return {
      totalRevenue: 0,
      occupancyRate: 0,
      upcomingPaymentsCount: 0,
      openIssuesCount: 0,
      monthlyRevenue: [],
      recentActivity: [],
    };
  }
}

export default async function Home() {
  const dashboardData = await getDashboardData();
  return (
    <div className="flex flex-col h-full">
      <Header title="Tableau de bord" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <DashboardClient data={dashboardData} />
      </div>
    </div>
  );
}
