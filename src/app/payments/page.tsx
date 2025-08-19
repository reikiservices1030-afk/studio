
'use client';

import { useState, useEffect } from 'react';
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
import { MoreHorizontal, PlusCircle, Printer, Loader2, Mail } from "lucide-react";
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
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, doc, DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


type Payment = {
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

type Tenant = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  propertyName: string;
};

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
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    tenantId: "",
    date: new Date().toISOString().split('T')[0],
    amount: "",
    status: "Payé",
    period: `${new Date().toLocaleString('fr-BE', { month: 'long' })} ${new Date().getFullYear()}`
  });
  const { toast } = useToast();

  useEffect(() => {
    const unsubPayments = onSnapshot(collection(db, "payments"), (snapshot) => {
      const paymentsData: Payment[] = [];
      snapshot.forEach((doc: DocumentData) => {
        paymentsData.push({ id: doc.id, ...doc.data() } as Payment);
      });
      setPayments(paymentsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    });

    const unsubTenants = onSnapshot(collection(db, "tenants"), (snapshot) => {
      const tenantsData: Tenant[] = [];
      snapshot.forEach((doc: DocumentData) => {
        tenantsData.push({ id: doc.id, ...doc.data() } as Tenant);
      });
      setTenants(tenantsData);
    });

    return () => {
      unsubPayments();
      unsubTenants();
    };
  }, []);

  const handleAddPayment = async () => {
    const tenant = tenants.find(t => t.id === newPayment.tenantId);
    if (!tenant || !newPayment.amount || !newPayment.date) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs."});
      return;
    }

    try {
      await addDoc(collection(db, "payments"), {
        tenant: `${tenant.firstName} ${tenant.lastName}`,
        tenantId: tenant.id,
        phone: tenant.phone,
        email: tenant.email,
        property: tenant.propertyName,
        date: newPayment.date,
        amount: parseFloat(newPayment.amount),
        status: newPayment.status,
        period: newPayment.period,
      });
      setIsAddPaymentOpen(false);
      setNewPayment({
        tenantId: "",
        date: new Date().toISOString().split('T')[0],
        amount: "",
        status: "Payé",
        period: `${new Date().toLocaleString('fr-BE', { month: 'long' })} ${new Date().getFullYear()}`
      });
      toast({ title: "Succès", description: "Paiement ajouté."});
    } catch (error) {
       console.error("Error adding payment:", error);
       toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter le paiement."});
    }
  };

  const getReceiptText = (payment: Payment) => {
    return `Bonjour ${payment.tenant},\n\nVoici votre reçu pour le loyer de ${payment.period}.\n\n- Montant : ${payment.amount.toFixed(2)} €\n- Date de paiement : ${payment.date}\n- Propriété : ${payment.property}\n\nCordialement.`;
  }

  const handleSendReceipt = (payment: Payment) => {
    if (!payment.phone) {
      toast({ variant: "destructive", title: "Erreur", description: "Numéro de téléphone du locataire manquant."});
      return;
    }
    const receiptText = getReceiptText(payment);
    const whatsappUrl = `https://wa.me/${payment.phone.replace(/\D/g, '')}?text=${encodeURIComponent(receiptText)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const handleEmailReceipt = (payment: Payment) => {
    if (!payment.email) {
      toast({ variant: "destructive", title: "Erreur", description: "Email du locataire manquant."});
      return;
    }
    const subject = `Reçu de loyer pour ${payment.period}`;
    const body = getReceiptText(payment);
    const mailtoUrl = `mailto:${payment.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handlePrintReceipt = (payment: Payment) => {
     const receiptContent = `
      <html>
        <head>
          <title>Reçu de Loyer - ${payment.period}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 2rem; color: #333; }
            .container { border: 1px solid #eee; padding: 2rem; border-radius: 10px; max-width: 800px; margin: auto; }
            .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
            .header h1 { margin: 0; color: #000; }
            .header p { margin: 0; color: #555; }
            .details { margin: 2rem 0; }
            .details table { width: 100%; border-collapse: collapse; }
            .details th, .details td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #eee; }
            .details th { color: #555; font-weight: normal; }
            .total { text-align: right; margin-top: 2rem; }
            .total h2 { margin: 0; font-size: 1.5rem; }
            .footer { text-align: center; margin-top: 2rem; font-size: 0.8rem; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>QUITTANCE DE LOYER</h1>
              <p>Reçu pour la période de ${payment.period}</p>
            </div>
            <div class="details">
              <table>
                <tr><th>Propriétaire:</th><td>[Nom du propriétaire]</td></tr>
                <tr><th>Locataire:</th><td>${payment.tenant}</td></tr>
                <tr><th>Propriété louée:</th><td>${payment.property}</td></tr>
                <tr><th>Date du paiement:</th><td>${payment.date}</td></tr>
              </table>
            </div>
            <div class="total">
              <h2>Total payé: ${payment.amount.toFixed(2)} €</h2>
            </div>
            <div class="footer">
              <p>Ceci est un reçu généré automatiquement. Pour toute question, veuillez nous contacter.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(receiptContent);
    printWindow?.document.close();
    printWindow?.print();
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Paiements">
        <Button size="sm" className="gap-1" onClick={() => setIsAddPaymentOpen(true)}>
          <PlusCircle className="h-3.5 w-3.5" />
          Ajouter un paiement
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Historique des paiements</CardTitle>
            <CardDescription>
              Suivez tous les paiements de loyer et générez des reçus.
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
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="font-medium">{payment.tenant}</div>
                      <div className="text-sm text-muted-foreground">{payment.property}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{payment.date}</TableCell>
                    <TableCell className="hidden sm:table-cell">{payment.amount.toFixed(2)} €</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'Payé' ? 'default' : 'destructive'}>{payment.status}</Badge>
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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleSendReceipt(payment)}>
                            <WhatsappIcon />
                            <span className="ml-2">Envoyer par WhatsApp</span>
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleEmailReceipt(payment)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Envoyer par Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintReceipt(payment)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimer le reçu
                          </DropdownMenuItem>
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

      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un paiement</DialogTitle>
            <DialogDescription>
              Enregistrez un nouveau paiement de loyer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tenant" className="text-right">Locataire</Label>
                <Select onValueChange={(value) => setNewPayment({...newPayment, tenantId: value})}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Sélectionnez un locataire" />
                    </SelectTrigger>
                    <SelectContent>
                        {tenants.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Montant (€)</Label>
              <Input id="amount" type="number" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Date</Label>
              <Input id="date" type="date" value={newPayment.date} onChange={(e) => setNewPayment({...newPayment, date: e.target.value})} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="period" className="text-right">Période</Label>
              <Input id="period" value={newPayment.period} onChange={(e) => setNewPayment({...newPayment, period: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Statut</Label>
                <Select value={newPayment.status} onValueChange={(value) => setNewPayment({...newPayment, status: value})}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Payé">Payé</SelectItem>
                        <SelectItem value="En retard">En retard</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleAddPayment}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
