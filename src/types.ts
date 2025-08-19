
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
  status: string;
  idCardUrl: string;
  idCardPath: string;
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
  tenant: string;
  tenantId: string;
  phone: string;
  email: string;
  property: string;
  date: string;
  amount: number;
  status: string;
  period: string;
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
