
export type OwnerInfo = {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  companyNumber?: string;
}

export type Tenant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  nationality: string;
  bankAccount: string;
  propertyId: string;
  propertyName: string;
  leaseStart: string;
  leaseDuration: number;
  status: 'Actif' | 'Inactif';
  idCardUrl: string;
  idCardPath: string;
  rent: number;
  paymentDueDay: number;
  depositAmount: number;
  depositStatus: 'Non payé' | 'Payé' | 'Remboursé' | 'Partiellement remboursé';
};

export type Property = {
  id: string;
  address: string;
  rent: number;
  imageUrl: string;
  imagePath: string;
};

export type Payment = {
  id: string;
  tenantFirstName: string;
  tenantLastName: string;
  tenantId: string;
  phone: string;
  email: string;
  property: string;
  date: string;
  amount: number;
  status: string;
  period: string; // e.g., "Juillet 2024" for rent, or "Caution" for deposit
  rentDue: number; // For rent payments, this is the rent amount. For deposit, the total deposit amount.
  type: 'Loyer' | 'Caution';
};

export type Reminder = {
  id: string;
  tenant: string;
  tenantId: string;
  property: string;
  dueDate: string;
  amount: number;
  status: "Envoyé" | "En attente" | "Programmé";
};

export type Document = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded: string;
  url: string;
  path: string;
};

export type Maintenance = {
    id: string;
    propertyId: string;
    propertyName: string;
    tenantId?: string;
    tenantName?: string;
    date: string;
    description: string;
    cost: number;
    deductedFromDeposit?: boolean;
};

export type GroupedPayment = {
  groupKey: string; // e.g., "tenantId-Loyer-Juillet 2024" or "tenantId-Caution"
  tenantId: string;
  tenantFirstName: string;
  tenantLastName: string;
  property: string;
  type: 'Loyer' | 'Caution';
  period: string;
  totalDue: number;
  totalPaid: number;
  status: string;
  payments: Payment[];
};
