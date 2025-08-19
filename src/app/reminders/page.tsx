
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
import { MoreHorizontal, PlusCircle, Bell, Send } from "lucide-react";
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


const initialReminders = [
  {
    id: "R001",
    tenant: "Jean Dupont",
    tenantId: "T001",
    property: "Appt 101, Rue de la Loi 1, 1000 Bruxelles",
    dueDate: "2024-08-01",
    amount: 1200,
    status: "Envoyé",
  },
  {
    id: "R002",
    tenant: "Marie Dubois",
    tenantId: "T002",
    property: "Unité 5, Grote Markt 1, 2000 Antwerpen",
    dueDate: "2024-08-01",
    amount: 1500,
    status: "Envoyé",
  },
  {
    id: "R003",
    tenant: "Luc Martin",
    tenantId: "T003",
    property: "Appt 202, Rue de la Loi 1, 1000 Bruxelles",
    dueDate: "2024-08-01",
    amount: 1250,
    status: "En attente",
  },
  {
    id: "R004",
    tenant: "Sophie Bernard",
    tenantId: "T004",
    property: "Maison, Rue Neuve 25, 1000 Bruxelles",
    dueDate: "2024-08-01",
    amount: 2500,
    status: "Programmé",
  },
  {
    id: "R005",
    tenant: "David Leroy",
    tenantId: "T005",
    property: "Condo 3, Place Saint-Lambert 1, 4000 Liège",
    dueDate: "2024-09-01",
    amount: 1800,
    status: "Programmé",
  },
];

// Mock tenants for the select dropdown
const tenants = [
   { id: "T001", name: "Jean Dupont", amount: 1200 },
   { id: "T002", name: "Marie Dubois", amount: 1500 },
   { id: "T003", name: "Luc Martin", amount: 1250 },
   { id: "T004", name: "Sophie Bernard", amount: 2500 },
   { id: "T005", name: "David Leroy", amount: 1800 },
];


export default function RemindersPage() {
    const [reminders, setReminders] = useState(initialReminders);
    const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
    const [newReminder, setNewReminder] = useState({
        tenantId: "",
        dueDate: "",
        amount: ""
    });

    const handleAddReminder = () => {
        const tenant = tenants.find(t => t.id === newReminder.tenantId);
        if (!tenant) return;

        setReminders(prev => [...prev, {
            id: `R${String(prev.length + 1).padStart(3, '0')}`,
            tenant: tenant.name,
            tenantId: tenant.id,
            property: "Propriété à récupérer",
            dueDate: newReminder.dueDate,
            amount: parseFloat(newReminder.amount) || tenant.amount,
            status: "Programmé"
        }]);
        setNewReminder({ tenantId: "", dueDate: "", amount: "" });
        setIsAddReminderOpen(false);
    }
    
    const sendReminder = (id: string) => {
        setReminders(reminders.map(r => r.id === id ? { ...r, status: "Envoyé" } : r));
    }

  return (
    <div className="flex flex-col h-full">
      <Header title="Rappels de loyer">
        <Button size="sm" className="gap-1" onClick={() => setIsAddReminderOpen(true)}>
          <PlusCircle className="h-3.5 w-3.5" />
          Nouveau rappel
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Rappels automatisés</CardTitle>
            <CardDescription>
              Gérez et suivez les rappels de loyer automatisés envoyés aux locataires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Locataire</TableHead>
                  <TableHead className="hidden md:table-cell">Propriété</TableHead>
                  <TableHead>Date d'échéance</TableHead>
                  <TableHead className="hidden sm:table-cell">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">{reminder.tenant}</TableCell>
                    <TableCell className="hidden md:table-cell">{reminder.property}</TableCell>
                    <TableCell>{reminder.dueDate}</TableCell>
                    <TableCell className="hidden sm:table-cell">{reminder.amount.toFixed(2)} €</TableCell>
                    <TableCell>
                      <Badge variant={reminder.status === 'Envoyé' ? 'default' : reminder.status === 'En attente' ? 'destructive' : 'secondary'}>{reminder.status}</Badge>
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
                          <DropdownMenuItem disabled={reminder.status === 'Envoyé'} onClick={() => sendReminder(reminder.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Envoyer maintenant
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Bell className="mr-2 h-4 w-4" />
                            Voir le calendrier
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
      <Dialog open={isAddReminderOpen} onOpenChange={setIsAddReminderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau rappel</DialogTitle>
            <DialogDescription>
              Sélectionnez un locataire et définissez les détails du rappel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tenant" className="text-right">Locataire</Label>
                <Select onValueChange={(value) => setNewReminder({...newReminder, tenantId: value})}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Sélectionnez un locataire" />
                    </SelectTrigger>
                    <SelectContent>
                        {tenants.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Montant (€)</Label>
              <Input id="amount" type="number" value={newReminder.amount} placeholder={`par défaut: ${tenants.find(t => t.id === newReminder.tenantId)?.amount || '0.00'}`} onChange={(e) => setNewReminder({...newReminder, amount: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">Date d'échéance</Label>
              <Input id="dueDate" type="date" value={newReminder.dueDate} onChange={(e) => setNewReminder({...newReminder, dueDate: e.target.value})} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleAddReminder}>Programmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
