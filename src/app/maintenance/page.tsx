
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
import { MoreHorizontal, PlusCircle, Loader2, Edit, Trash2, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Textarea } from '@/components/ui/textarea';
import { db } from "@/lib/firebase";
import { ref, onValue, push, update, remove } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import type { Tenant, Property, Maintenance } from '@/types';

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

export default function MaintenancePage() {
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentMaintenance, setCurrentMaintenance] = useState<Partial<Maintenance>>({});
    const { toast } = useToast();

    useEffect(() => {
        const maintenancesRef = ref(db, "maintenances");
        const unsubMaintenances = onValue(maintenancesRef, (snapshot) => {
            const data: Maintenance[] = [];
            snapshot.forEach((childSnapshot) => {
                data.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
            setMaintenances(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setLoading(false);
        });

        const propertiesRef = ref(db, 'properties');
        const unsubProperties = onValue(propertiesRef, (snapshot) => {
            const data: Property[] = [];
            snapshot.forEach((child) => data.push({ id: child.key!, ...child.val() }));
            setProperties(data);
        });
        
        const tenantsRef = ref(db, 'tenants');
        const unsubTenants = onValue(tenantsRef, (snapshot) => {
            const data: Tenant[] = [];
            snapshot.forEach((child) => data.push({ id: child.key!, ...child.val() }));
            setTenants(data);
        });

        return () => {
            unsubMaintenances();
            unsubProperties();
            unsubTenants();
        };
    }, []);

    const resetDialog = () => {
        setIsDialogOpen(false);
        setIsEditing(false);
        setCurrentMaintenance({ date: new Date().toISOString().split('T')[0] });
    };

    const handleSave = async () => {
        const { propertyId, description, cost, date } = currentMaintenance;
        if (!propertyId || !description || !cost || !date) {
            toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs obligatoires." });
            return;
        }

        const property = properties.find(p => p.id === propertyId);
        const tenant = tenants.find(t => t.id === currentMaintenance.tenantId);

        const maintenanceData = {
            ...currentMaintenance,
            cost: Number(cost),
            propertyName: property?.address || 'N/A',
            tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Aucun',
        };

        try {
            if (isEditing && currentMaintenance.id) {
                await update(ref(db, `maintenances/${currentMaintenance.id}`), maintenanceData);
                toast({ title: "Succès", description: "Maintenance mise à jour." });
            } else {
                await push(ref(db, 'maintenances'), maintenanceData);
                toast({ title: "Succès", description: "Maintenance ajoutée." });
            }
            resetDialog();
        } catch (error) {
            console.error("Error saving maintenance:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer la maintenance." });
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
            try {
                await remove(ref(db, `maintenances/${id}`));
                toast({ title: "Succès", description: "Maintenance supprimée." });
            } catch (error) {
                console.error("Error deleting maintenance:", error);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la maintenance." });
            }
        }
    };

    const openEditDialog = (maintenance: Maintenance) => {
        setCurrentMaintenance(maintenance);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const getMessageText = (item: Maintenance) => {
        return `Bonjour ${item.tenantName},\n\nCeci est une notification concernant une intervention de maintenance sur votre propriété.\n\nDétails:\n- Date: ${item.date}\n- Description: ${item.description}\n- Coût: ${item.cost.toFixed(2)} €\n\nCordialement,`;
    };

    const handleSendWhatsApp = (item: Maintenance) => {
        const tenant = tenants.find(t => t.id === item.tenantId);
        if (!tenant || !tenant.phone) {
            toast({ variant: "destructive", title: "Erreur", description: "Numéro de téléphone du locataire manquant." });
            return;
        }
        const message = getMessageText(item);
        const whatsappUrl = `https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleSendEmail = (item: Maintenance) => {
        const tenant = tenants.find(t => t.id === item.tenantId);
        if (!tenant || !tenant.email) {
            toast({ variant: "destructive", title: "Erreur", description: "Email du locataire manquant." });
            return;
        }
        const subject = `Notification de maintenance: ${item.description}`;
        const body = getMessageText(item);
        const mailtoUrl = `mailto:${tenant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
    };

    return (
        <div className="flex flex-col h-full">
            <Header title="Maintenance et Réparations">
                <Button size="sm" className="gap-1" onClick={() => { setIsEditing(false); setCurrentMaintenance({ date: new Date().toISOString().split('T')[0] }); setIsDialogOpen(true); }}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    Ajouter une dépense
                </Button>
            </Header>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Suivi des frais de maintenance</CardTitle>
                        <CardDescription>
                            Enregistrez toutes les dépenses liées à la réparation et à l'entretien de vos biens.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Propriété</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="hidden sm:table-cell">Locataire associé</TableHead>
                                        <TableHead className="text-right">Coût</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {maintenances.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.date}</TableCell>
                                            <TableCell className="font-medium">{item.propertyName}</TableCell>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{item.tenantName}</TableCell>
                                            <TableCell className="text-right font-semibold">{item.cost.toFixed(2)} €</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditDialog(item)}><Edit className="mr-2 h-4 w-4"/> Modifier</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="mr-2 h-4 w-4"/> Supprimer</DropdownMenuItem>
                                                        {item.tenantId && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleSendWhatsApp(item)}>
                                                                    <WhatsappIcon />
                                                                    <span className="ml-2">Envoyer par WhatsApp</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleSendEmail(item)}>
                                                                    <Mail className="mr-2 h-4 w-4" />
                                                                    Envoyer par Email
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
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
                        <DialogTitle>{isEditing ? 'Modifier la dépense' : 'Ajouter une dépense'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Propriété</Label>
                            <Select value={currentMaintenance.propertyId} onValueChange={(value) => setCurrentMaintenance({ ...currentMaintenance, propertyId: value, tenantId: undefined })}>
                                <SelectTrigger><SelectValue placeholder="Sélectionnez une propriété" /></SelectTrigger>
                                <SelectContent>
                                    {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={currentMaintenance.description || ''} onChange={(e) => setCurrentMaintenance({ ...currentMaintenance, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" value={currentMaintenance.date || ''} onChange={(e) => setCurrentMaintenance({ ...currentMaintenance, date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Coût (€)</Label>
                                <Input type="number" value={currentMaintenance.cost || ''} onChange={(e) => setCurrentMaintenance({ ...currentMaintenance, cost: Number(e.target.value) })} />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Locataire (si applicable)</Label>
                            <Select value={currentMaintenance.tenantId} onValueChange={(value) => setCurrentMaintenance({ ...currentMaintenance, tenantId: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Associer à un locataire" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Aucun</SelectItem>
                                    {tenants.filter(t => t.propertyId === currentMaintenance.propertyId).map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" onClick={resetDialog}>Annuler</Button></DialogClose>
                        <Button onClick={handleSave}>{isEditing ? 'Enregistrer' : 'Ajouter'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
