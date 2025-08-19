
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
import { MoreHorizontal, PlusCircle, Bell, Send, Loader2 } from "lucide-react";
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
import { collection, addDoc, onSnapshot, doc, updateDoc, DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type Reminder = {
  id: string;
  tenant: string;
  tenantId: string;
  property: string;
  dueDate: string;
  amount: number;
  status: "Envoyé" | "En attente" | "Programmé";
};

type Tenant = {
  id: string;
  name: string;
  property: string;
};

export default function RemindersPage() {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
    const [newReminder, setNewReminder] = useState({
        tenantId: "",
        dueDate: "",
        amount: ""
    });
    const { toast } = useToast();

    useEffect(() => {
        const unsubReminders = onSnapshot(collection(db, "reminders"), (snapshot) => {
          const data: Reminder[] = [];
          snapshot.forEach((doc: DocumentData) => {
            data.push({ id: doc.id, ...doc.data() } as Reminder);
          });
          setReminders(data.sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
          setLoading(false);
        });

        const unsubTenants = onSnapshot(collection(db, "tenants"), (snapshot) => {
          const data: Tenant[] = [];
          snapshot.forEach((doc: DocumentData) => {
            data.push({ id: doc.id, ...doc.data() } as Tenant);
          });
          setTenants(data);
        });

        return () => {
          unsubReminders();
          unsubTenants();
        };
    }, []);

    const handleAddReminder = async () => {
        const tenant = tenants.find(t => t.id === newReminder.tenantId);
        if (!tenant || !newReminder.dueDate || !newReminder.amount) {
            toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs." });
            return;
        }

        try {
            await addDoc(collection(db, "reminders"), {
                tenant: tenant.name,
                tenantId: tenant.id,
                property: tenant.property,
                dueDate: newReminder.dueDate,
                amount: parseFloat(newReminder.amount),
                status: "Programmé"
            });
            setNewReminder({ tenantId: "", dueDate: "", amount: "" });
            setIsAddReminderOpen(false);
            toast({ title: "Succès", description: "Rappel programmé." });
        } catch (error) {
            console.error("Error adding reminder:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de programmer le rappel." });
        }
    }
    
    const sendReminder = async (id: string) => {
        try {
            const reminderRef = doc(db, "reminders", id);
            await updateDoc(reminderRef, { status: "Envoyé" });
            toast({ title: "Succès", description: "Rappel marqué comme envoyé." });
        } catch (error) {
             console.error("Error sending reminder:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le rappel." });
        }
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
              Gérez et suivez les rappels de loyer envoyés aux locataires.
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
                            Marquer comme envoyé
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
            )}
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
              <Input id="amount" type="number" value={newReminder.amount} placeholder="Montant du loyer" onChange={(e) => setNewReminder({...newReminder, amount: e.target.value})} className="col-span-3" />
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
