
'use client';

import { useState, useEffect } from "react";
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
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react";
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
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type Tenant = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  property: string;
  status: string;
  leaseEnd: string;
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    email: "",
    phone: "",
    nationalId: "",
    property: "",
    leaseEnd: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tenants"), (snapshot) => {
      const tenantsData: Tenant[] = [];
      snapshot.forEach((doc: DocumentData) => {
        tenantsData.push({ id: doc.id, ...doc.data() } as Tenant);
      });
      setTenants(tenantsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tenants:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les locataires.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAddTenant = async () => {
    if (!newTenant.name || !newTenant.email) {
       toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Le nom et l'email sont obligatoires.",
      });
      return;
    }
    try {
      await addDoc(collection(db, "tenants"), {
        ...newTenant,
        status: "Actif"
      });
      setNewTenant({ name: "", email: "", phone: "", nationalId: "", property: "", leaseEnd: "" });
      setIsAddTenantOpen(false);
      toast({
        title: "Succès",
        description: "Nouveau locataire ajouté.",
      });
    } catch (error) {
      console.error("Error adding tenant: ", error);
       toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter le locataire.",
      });
    }
  }

  const handleDeleteTenant = async (id: string) => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer ce locataire ?")) {
      try {
        await deleteDoc(doc(db, "tenants", id));
        toast({
          title: "Succès",
          description: "Locataire supprimé.",
        });
      } catch (error) {
        console.error("Error deleting tenant: ", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de supprimer le locataire.",
        });
      }
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      <Header title="Locataires">
        <Button size="sm" className="gap-1" onClick={() => setIsAddTenantOpen(true)}>
          <PlusCircle className="h-3.5 w-3.5" />
          Ajouter un locataire
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Gestion des locataires</CardTitle>
            <CardDescription>
              Consultez, ajoutez et gérez vos locataires.
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
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden md:table-cell">Propriété</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Fin du bail</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-sm text-muted-foreground">{tenant.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{tenant.property}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === 'Actif' ? 'secondary' : tenant.status === 'En retard' ? 'destructive' : 'outline'}>{tenant.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{tenant.leaseEnd}</TableCell>
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
                          <DropdownMenuItem>Voir les détails</DropdownMenuItem>
                          <DropdownMenuItem>Envoyer un message</DropdownMenuItem>
                          <DropdownMenuItem>Modifier</DropdownMenuItem>
                           <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTenant(tenant.id)}>Supprimer</DropdownMenuItem>
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

       <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau locataire</DialogTitle>
            <DialogDescription>
              Remplissez les informations ci-dessous pour ajouter un nouveau locataire.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nom</Label>
              <Input id="name" value={newTenant.name} onChange={(e) => setNewTenant({...newTenant, name: e.target.value})} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" value={newTenant.email} onChange={(e) => setNewTenant({...newTenant, email: e.target.value})} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Téléphone</Label>
              <Input id="phone" value={newTenant.phone} onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nationalId" className="text-right">N° National</Label>
              <Input id="nationalId" value={newTenant.nationalId} onChange={(e) => setNewTenant({...newTenant, nationalId: e.target.value})} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="property" className="text-right">Propriété</Label>
              <Input id="property" value={newTenant.property} onChange={(e) => setNewTenant({...newTenant, property: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaseEnd" className="text-right">Fin du bail</Label>
              <Input id="leaseEnd" type="date" value={newTenant.leaseEnd} onChange={(e) => setNewTenant({...newTenant, leaseEnd: e.target.value})} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleAddTenant}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
