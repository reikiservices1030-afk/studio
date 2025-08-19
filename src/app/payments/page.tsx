
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Printer, Loader2, Mail, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, storage } from "@/lib/firebase";
import { ref, onValue, push, update } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import type { Tenant as TenantType, Payment, OwnerInfo, GroupedPayment, Property } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


const WhatsappIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );


export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<TenantType[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Partial<Payment>>({
    tenantId: "",
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    status: "Payé",
    type: "Loyer",
    period: `${new Date().toLocaleString('fr-BE', { month: 'long' })} ${new Date().getFullYear()}`
  });
  const { toast } = useToast();
  
  const recentPeriods = useMemo(() => {
    const periods = new Set<string>();
    const d = new Date();
    for (let i = 0; i < 6; i++) {
        const monthDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
        const month = monthDate.toLocaleString('fr-BE', { month: 'long' });
        const year = monthDate.getFullYear();
        if (month) {
          const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
          periods.add(`${capitalizedMonth} ${year}`);
        }
    }
    return Array.from(periods);
  }, []);

  useEffect(() => {
    const paymentsRef = ref(db, "payments");
    const unsubPayments = onValue(paymentsRef, (snapshot) => {
      const paymentsData: Payment[] = [];
      const val = snapshot.val();
      if (val) {
        Object.keys(val).forEach((key) => {
          paymentsData.push({ id: key, ...val[key] });
        });
      }
      setPayments(paymentsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    });

    const tenantsRef = ref(db, "tenants");
    const unsubTenants = onValue(tenantsRef, (snapshot) => {
      const tenantsData: TenantType[] = [];
      const val = snapshot.val();
       if (val) {
        Object.keys(val).forEach((key) => {
          tenantsData.push({ id: key, ...val[key] });
        });
      }
      setTenants(tenantsData);
    });
    
    const propertiesRef = ref(db, 'properties');
    const unsubProperties = onValue(propertiesRef, (snapshot) => {
      const data: Property[] = [];
      snapshot.forEach((child) => data.push({id: child.key!, ...child.val()}));
      setProperties(data);
    });

    const ownerInfoRef = ref(db, 'ownerInfo');
    const unsubOwner = onValue(ownerInfoRef, (snapshot) => {
      setOwnerInfo(snapshot.val());
    });

    return () => {
      unsubPayments();
      unsubTenants();
      unsubProperties();
      unsubOwner();
    };
  }, []);

  const groupedPayments = useMemo((): GroupedPayment[] => {
    const groups: { [key: string]: GroupedPayment } = {};

    payments.forEach(p => {
        const groupKey = `${p.tenantId}-${p.type}-${p.period}`;
        
        if (!groups[groupKey]) {
            const tenant = tenants.find(t => t.id === p.tenantId);
            const property = tenant ? properties.find(prop => prop.id === tenant.propertyId) : undefined;
            
            let rentDue = 0;
            if (p.type === 'Loyer' && tenant) {
                rentDue = tenant.rent || 0;
            } else if (p.type === 'Caution' && tenant) {
                rentDue = tenant.depositAmount || 0;
            }

            groups[groupKey] = {
                groupKey,
                tenantId: p.tenantId,
                tenantFirstName: p.tenantFirstName,
                tenantLastName: p.tenantLastName,
                property: p.property,
                type: p.type,
                period: p.period,
                totalDue: p.rentDue || rentDue, // Use stored rentDue, fallback to calculated
                totalPaid: 0,
                status: '',
                payments: [],
            };
        }
        groups[groupKey].payments.push(p);
        if(p.status === 'Payé') {
          groups[groupKey].totalPaid += p.amount;
        }
        // Ensure totalDue is set from the first payment of the group, if not already set
        if (!groups[groupKey].totalDue && p.rentDue) {
          groups[groupKey].totalDue = p.rentDue;
        }
    });

    return Object.values(groups).map(group => {
        if (group.totalDue > 0 && group.totalPaid >= group.totalDue) {
            group.status = 'Payé';
        } else if (group.totalPaid > 0) {
            group.status = 'Partiel';
        } else {
            group.status = 'Non payé';
        }
        // Sort individual payments within the group by date
        group.payments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return group;
    }).sort((a,b) => {
      // Prioritize period sorting for consistent order
      if (a.period > b.period) return -1;
      if (a.period < b.period) return 1;
      return 0;
    });
  }, [payments, tenants, properties]);
  
  const resetDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    const firstPeriod = recentPeriods[0] || '';
    const capitalizedPeriod = firstPeriod ? firstPeriod.charAt(0).toUpperCase() + firstPeriod.slice(1) : '';

    setCurrentPayment({
        tenantId: "",
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        status: "Payé",
        type: "Loyer",
        period: capitalizedPeriod || `${new Date().toLocaleString('fr-BE', { month: 'long' })} ${new Date().getFullYear()}`
    });
  };

  const handleSavePayment = async () => {
    const tenant = tenants.find(t => t.id === currentPayment.tenantId);
    if (!tenant || !currentPayment.amount || !currentPayment.date || !currentPayment.type) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs."});
      return;
    }
    
    let rentDue = 0;
    if (currentPayment.type === 'Loyer') {
        rentDue = tenant.rent || 0;
    } else if (currentPayment.type === 'Caution') {
        rentDue = tenant.depositAmount || 0;
    }
    
    const period = currentPayment.type === 'Loyer' && currentPayment.period ? currentPayment.period : 'Caution';

    try {
      const paymentData = {
        ...currentPayment,
        amount: Number(currentPayment.amount),
        tenantFirstName: tenant.firstName,
        tenantLastName: tenant.lastName,
        tenantId: tenant.id,
        phone: tenant.phone,
        email: tenant.email,
        property: tenant.propertyName,
        rentDue,
        period,
      };
      
      if (isEditing && currentPayment.id) {
        const { id, ...dataToUpdate } = paymentData;
        const paymentRef = ref(db, `payments/${id}`);
        await update(paymentRef, dataToUpdate);
        toast({ title: "Succès", description: "Paiement mis à jour."});

      } else {
        const { id, ...dataToCreate } = paymentData;
        await push(ref(db, "payments"), dataToCreate);
        toast({ title: "Succès", description: "Paiement ajouté."});
      }
      resetDialog();
    } catch (error) {
       console.error("Error saving payment:", error);
       toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer le paiement."});
    }
  };
  
  const openEditDialog = (payment: Payment) => {
    setCurrentPayment(payment);
    setIsEditing(true);
    setIsDialogOpen(true);
  };
  
  const openAddDialog = () => {
    setIsEditing(false);
     const firstPeriod = recentPeriods[0] || '';
    const capitalizedPeriod = firstPeriod ? firstPeriod.charAt(0).toUpperCase() + firstPeriod.slice(1) : '';

    setCurrentPayment({
        tenantId: "",
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        status: "Payé",
        type: 'Loyer',
        period: capitalizedPeriod || `${new Date().toLocaleString('fr-BE', { month: 'long' })} ${new Date().getFullYear()}`
    });
    setIsDialogOpen(true);
  }

  const getReceiptText = (group: GroupedPayment) => {
    const balance = (group.totalDue || 0) - (group.totalPaid || 0);
    let balanceText = `Solde restant pour ${group.period}: ${balance.toFixed(2)} €`;
    if (balance <= 0) {
      balanceText = "Ce paiement solde la période.";
    }

    let paymentsDetails = group.payments.map(p => `- ${new Date(p.date).toLocaleDateString('fr-BE')}: ${(p.amount || 0).toFixed(2)} €`).join('\n');

    return `Bonjour ${group.tenantFirstName} ${group.tenantLastName},\n\nVoici votre reçu pour le paiement de ${(group.type || '').toLowerCase()} pour ${group.period}.\n\n- Montant total dû : ${(group.totalDue || 0).toFixed(2)} €\n- Montant total payé : ${(group.totalPaid || 0).toFixed(2)} €\n- Propriété : ${group.property}\n\nDétails des paiements:\n${paymentsDetails}\n\n${balanceText}\n\nCordialement,\n${ownerInfo?.name || ''}`;
  }

  const handleSendReceipt = (group: GroupedPayment) => {
    const tenant = tenants.find(t => t.id === group.tenantId);
    if (!tenant?.phone) {
      toast({ variant: "destructive", title: "Erreur", description: "Numéro de téléphone du locataire manquant."});
      return;
    }
    const receiptText = getReceiptText(group);
    const whatsappUrl = `https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(receiptText)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const handleEmailReceipt = (group: GroupedPayment) => {
    const tenant = tenants.find(t => t.id === group.tenantId);
    if (!tenant?.email) {
      toast({ variant: "destructive", title: "Erreur", description: "Email du locataire manquant."});
      return;
    }
    const subject = `Reçu de paiement pour ${group.period}`;
    const body = getReceiptText(group);
    const mailtoUrl = `mailto:${tenant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const getReceiptHTML = (group: GroupedPayment) => {
    const balance = (group.totalDue || 0) - (group.totalPaid || 0);
    const balanceText = balance > 0 ? `<tr><th style="color: #e53e3e;">Solde restant:</th><td style="color: #e53e3e; font-weight: bold;">${balance.toFixed(2)} €</td></tr>` : '<tr><td colspan="2" style="text-align:center; font-weight:bold; color: #38a169;">Paiement complet</td></tr>';
    const paymentsHtml = group.payments.map(p => `<tr><td>Paiement du ${new Date(p.date).toLocaleDateString('fr-BE')}</td><td>${(p.amount || 0).toFixed(2)} €</td></tr>`).join('');
    const type = group.type || '';

    return `
      <html>
        <head>
          <title>Quittance de ${type} - ${group.period}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 2rem; color: #333; }
            .container { border: 1px solid #eee; padding: 2rem; border-radius: 10px; max-width: 800px; margin: auto; background: white; }
            .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 2rem;}
            .header h1 { margin: 0; color: #000; }
            .header p { margin: 0; color: #555; }
            .parties { display: flex; justify-content: space-between; margin-bottom: 2rem;}
            .party { width: 48%; }
            .party h2 { font-size: 1rem; color: #555; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-bottom: 0.5rem; }
            .details { margin: 2rem 0; }
            .details table { width: 100%; border-collapse: collapse; }
            .details th, .details td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #eee; }
            .details th { color: #555; font-weight: normal; width: 40%;}
            .total { text-align: right; margin-top: 1rem; }
            .total td { font-size: 1.2rem; font-weight: bold; }
            .footer { text-align: center; margin-top: 2rem; font-size: 0.8rem; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>QUITTANCE DE ${type.toUpperCase()}</h1>
              <p>Période: ${group.period}</p>
            </div>
             <div class="parties">
                <div class="party">
                    <h2>Bailleur</h2>
                    <p><strong>${ownerInfo?.name || '[Nom du propriétaire]'}</strong><br>${ownerInfo?.address || '[Adresse du propriétaire]'}</p>
                </div>
                <div class="party">
                    <h2>Locataire</h2>
                    <p><strong>${group.tenantFirstName} ${group.tenantLastName}</strong><br>${group.property}</p>
                </div>
            </div>
            <div class="details">
              <h4>Détails des versements</h4>
              <table>
                ${paymentsHtml}
              </table>
              <table class="total">
                <tr><th>Total dû:</th><td>${(group.totalDue || 0).toFixed(2)} €</td></tr>
                <tr><th>Total payé:</th><td style="color: #38a169; font-weight: bold;">${(group.totalPaid || 0).toFixed(2)} €</td></tr>
                ${balanceText}
              </table>
            </div>
            <div class="footer">
              <p>Ceci est un reçu généré automatiquement. Pour toute question, veuillez nous contacter.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  const handlePrintReceipt = async (group: GroupedPayment) => {
    const receiptHtml = getReceiptHTML(group);

    const printWindow = window.open('', '_blank');
    if(printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
    } else {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ouvrir la fenêtre d'impression. Veuillez désactiver votre bloqueur de pop-ups." });
    }
  };

  const handlePeriodChange = (period: string) => {
    if (!currentPayment.tenantId) {
        setCurrentPayment({ ...currentPayment, period: period });
        return;
    }
    const tenant = tenants.find(t => t.id === currentPayment.tenantId);
    if (!tenant) return;

    const groupKey = `${currentPayment.tenantId}-Loyer-${period}`;
    const existingGroup = groupedPayments.find(g => g.groupKey === groupKey);

    if (existingGroup && existingGroup.status !== 'Payé') {
      const remainingAmount = (existingGroup.totalDue || 0) - (existingGroup.totalPaid || 0);
      setCurrentPayment({ ...currentPayment, period: period, amount: remainingAmount > 0 ? remainingAmount : 0 });
    } else {
      setCurrentPayment({ ...currentPayment, period: period, amount: tenant.rent || 0 });
    }
  };
  
  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    
    let amount = 0;
    if(tenant){
        if (currentPayment.type === 'Loyer') {
            amount = tenant.rent;
        } else if (currentPayment.type === 'Caution') {
            amount = tenant.depositAmount || 0;
        }
    }
    
    const updatedPayment = {
        ...currentPayment,
        tenantId: tenantId,
        amount: amount,
    };
    setCurrentPayment(updatedPayment);

    if (updatedPayment.type === 'Loyer' && updatedPayment.period) {
        // Re-evaluate amount based on the selected period for the new tenant
        const groupKey = `${tenantId}-Loyer-${updatedPayment.period}`;
        const existingGroup = groupedPayments.find(g => g.groupKey === groupKey);
        if (existingGroup && existingGroup.status !== 'Payé') {
            const remainingAmount = (existingGroup.totalDue || 0) - (existingGroup.totalPaid || 0);
            setCurrentPayment({ ...updatedPayment, amount: remainingAmount > 0 ? remainingAmount : 0 });
        } else {
            setCurrentPayment({ ...updatedPayment, amount: tenant.rent || 0 });
        }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Paiements">
        <Button size="sm" className="gap-1" onClick={openAddDialog}>
          <PlusCircle className="h-3.5 w-3.5" />
          Ajouter un paiement
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Historique des paiements</CardTitle>
            <CardDescription>
              Suivez tous les paiements de loyer et de caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Locataire</TableHead>
                  <TableHead>Type / Période</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Montant Payé / Dû</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedPayments.map((group) => (
                  <TableRow key={group.groupKey}>
                    <TableCell>
                      <div className="font-medium">{group.tenantFirstName} {group.tenantLastName}</div>
                      <div className="text-sm text-muted-foreground">{group.property}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{group.type}</div>
                        <div className="text-sm text-muted-foreground">{group.period}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right">
                        <div className="font-medium">{(group.totalPaid || 0).toFixed(2)} € / {(group.totalDue || 0).toFixed(2)} €</div>
                        <div className="text-sm text-muted-foreground">
                            {group.payments.length} versement(s)
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={group.status === 'Payé' ? 'default' : (group.status === 'Partiel' ? 'secondary' : 'destructive')}>
                        {group.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions sur le groupe</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handlePrintReceipt(group)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimer le reçu
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendReceipt(group)}>
                            <WhatsappIcon />
                            <span className="ml-2">Envoyer par WhatsApp</span>
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleEmailReceipt(group)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Envoyer par Email
                          </DropdownMenuItem>
                          <DropdownMenuLabel>Versements individuels</DropdownMenuLabel>
                           {group.payments.map(p => (
                             <DropdownMenuItem key={p.id} onClick={() => openEditDialog(p)}>
                                <Edit className="mr-2 h-4 w-4" /> 
                                Modifier {(p.amount || 0).toFixed(2)}€ du {new Date(p.date).toLocaleDateString('fr-BE')}
                             </DropdownMenuItem>
                           ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Modifier le paiement' : 'Ajouter un paiement'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Mettez à jour les détails de ce paiement.' : 'Enregistrez un nouveau paiement.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Type</Label>
                <Select
                    onValueChange={(value: 'Loyer' | 'Caution') => {
                        const tenant = tenants.find(t => t.id === currentPayment.tenantId);
                        let amount = 0;
                        if(tenant) {
                           amount = value === 'Loyer' ? tenant.rent : (tenant.depositAmount || 0);
                        }
                        const period = value === 'Loyer' ? (recentPeriods[0] || '') : 'Caution';
                        setCurrentPayment({ ...currentPayment, type: value, amount: amount || 0, period });
                    }}
                    value={currentPayment.type}
                    disabled={!isEditing && false}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Loyer">Loyer</SelectItem>
                        <SelectItem value="Caution">Caution</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label>Locataire</Label>
                <Select 
                    onValueChange={handleTenantChange}
                    value={currentPayment.tenantId}
                    disabled={!isEditing && false}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un locataire" />
                    </SelectTrigger>
                    <SelectContent>
                        {tenants.filter(t => t.status === 'Actif').map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.propertyName})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {currentPayment.type === 'Loyer' && <div className="space-y-2">
              <Label>Période</Label>
               <Select
                  onValueChange={handlePeriodChange}
                  value={currentPayment.period}
                   disabled={!isEditing && false}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une période" />
                  </SelectTrigger>
                  <SelectContent>
                    {recentPeriods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>}
             <div className="space-y-2">
              <Label>Montant (€)</Label>
              <Input id="amount" type="number" value={currentPayment.amount || ''} onChange={(e) => setCurrentPayment({...currentPayment, amount: Number(e.target.value)})}/>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input id="date" type="date" value={currentPayment.date || ''} onChange={(e) => setCurrentPayment({...currentPayment, date: e.target.value})}/>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" onClick={resetDialog}>Annuler</Button></DialogClose>
            <Button onClick={handleSavePayment}>{isEditing ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
