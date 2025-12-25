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
import { ref, onValue, push, update } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import type { Tenant as TenantType, Reminder } from '@/types';

export default function RemindersPage() {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [tenants, setTenants] = useState<TenantType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
    const [newReminder, setNewReminder] = useState({
        tenantId: "",
        dueDate: "",
        amount: ""
    });
    const { toast } = useToast();

    useEffect(() => {
        const remindersRef = ref(db, "reminders");
        const unsubReminders = onValue(remindersRef, (snapshot) => {
          const data: Reminder[] = [];
          const val = snapshot.val();
          if (val) {
            Object.keys(val).forEach((key) => {
              data.push({ id: key, ...val[key] });
            });
          }
          setReminders(data.sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
          setLoading(false);
        });

        const tenantsRef = ref(db, "tenants");
        const unsubTenants = onValue(tenantsRef, (snapshot) => {
          const data: TenantType[] = [];
          const val = snapshot.val();
          if (val) {
             Object.keys(val).forEach((key) => {
              data.push({ id: key, ...val[key] });
            });
          }
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
        setSaving(true);
        try {
            await push(ref(db, "reminders"), {
                tenant: `${tenant.firstName} ${tenant.lastName}`,
                tenantId: tenant.id,
                property: tenant.propertyName,
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
        } finally {
            setSaving(false);
        }
    }
    
    const sendReminder = async (id: string) => {
        try {
            const reminderRef = ref(db, `reminders/${id}`);
            await update(reminderRef, { status: "Envoyé" });
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Locataire</Label>
                <Select onValueChange={(value) => setNewReminder({...newReminder, tenantId: value})}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un locataire" />
                    </SelectTrigger>
                    <SelectContent>
                        {tenants.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
              <Label>Montant (€)</Label>
              <Input id="amount" type="number" value={newReminder.amount} placeholder="Montant du loyer" onChange={(e) => setNewReminder({...newReminder, amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Date d'échéance</Label>
              <Input id="dueDate" type="date" value={newReminder.dueDate} onChange={(e) => setNewReminder({...newReminder, dueDate: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleAddReminder} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Programmation...' : 'Programmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
