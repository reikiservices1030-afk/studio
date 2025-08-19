
'use client';

import { useState } from 'react';
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
import { MoreHorizontal, PlusCircle, Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const initialPayments = [
  {
    id: "PAY-2024-001",
    tenant: "Jean Dupont",
    phone: "+32470123456",
    property: "Appt 101, Rue de la Loi 1",
    date: "2024-07-01",
    amount: 1200,
    status: "Payé",
    period: "Juillet 2024",
  },
  {
    id: "PAY-2024-002",
    tenant: "Marie Dubois",
    phone: "+32486123456",
    property: "Unité 5, Grote Markt 1",
    date: "2024-07-03",
    amount: 1500,
    status: "Payé",
    period: "Juillet 2024",
  },
  {
    id: "PAY-2024-003",
    tenant: "Sophie Bernard",
    phone: "+32475123456",
    property: "Maison, Rue Neuve 25",
    date: "2024-07-05",
    amount: 2500,
    status: "En retard",
    period: "Juillet 2024",
  },
  {
    id: "PAY-2024-004",
    tenant: "Luc Martin",
    phone: "+32495123456",
    property: "Appt 202, Rue de la Loi 1",
    date: "2024-06-01",
    amount: 1250,
    status: "Payé",
    period: "Juin 2024",
  },
];

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
  const [payments, setPayments] = useState(initialPayments);

  const handleSendReceipt = (payment: typeof payments[0]) => {
    const receiptText = `Bonjour ${payment.tenant},\n\nVoici votre reçu pour le loyer de ${payment.period}.\n\nMontant : ${payment.amount.toFixed(2)} €\nDate de paiement : ${payment.date}\nPropriété : ${payment.property}\n\nMerci.`;
    const whatsappUrl = `https://wa.me/${payment.phone}?text=${encodeURIComponent(receiptText)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const handlePrintReceipt = (payment: typeof payments[0]) => {
     const receiptContent = `
      <html>
        <head>
          <title>Reçu de Loyer</title>
          <style>
            body { font-family: sans-serif; margin: 2rem; }
            h1 { color: #333; }
            p { margin: 0.5rem 0; }
            .details { border: 1px solid #ccc; padding: 1rem; border-radius: 8px; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <h1>Reçu de Loyer</h1>
          <div class="details">
            <p><strong>Locataire :</strong> ${payment.tenant}</p>
            <p><strong>Propriété :</strong> ${payment.property}</p>
            <p><strong>Date de paiement :</strong> ${payment.date}</p>
            <p><strong>Période :</strong> ${payment.period}</p>
            <p><strong>Montant payé :</strong> ${payment.amount.toFixed(2)} €</p>
          </div>
          <p style="margin-top: 2rem;">Merci pour votre paiement.</p>
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
        <Button size="sm" className="gap-1" onClick={() => alert('Fonctionnalité à implémenter')}>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
