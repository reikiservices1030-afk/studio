
'use client';

import { useState } from "react";
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
import { MoreHorizontal, PlusCircle } from "lucide-react";
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

const initialTenants = [
  {
    id: "T001",
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    phone: "+32470123456",
    nationalId: "85.01.15-123.45",
    property: "Appt 101, Rue de la Loi 1, 1000 Bruxelles",
    status: "Actif",
    leaseEnd: "2024-12-31",
  },
  {
    id: "T002",
    name: "Marie Dubois",
    email: "marie.dubois@example.com",
    phone: "+32486123456",
    nationalId: "90.03.20-111.22",
    property: "Unité 5, Grote Markt 1, 2000 Antwerpen",
    status: "Actif",
    leaseEnd: "2025-06-30",
  },
  {
    id: "T003",
    name: "Luc Martin",
    email: "luc.martin@example.com",
    phone: "+32495123456",
    nationalId: "88.11.05-222.33",
    property: "Appt 202, Rue de la Loi 1, 1000 Bruxelles",
    status: "Partant",
    leaseEnd: "2024-08-31",
  },
  {
    id: "T004",
    name: "Sophie Bernard",
    email: "sophie.b@example.com",
    phone: "+32475123456",
    nationalId: "92.07.18-333.44",
    property: "Maison, Rue Neuve 25, 1000 Bruxelles",
    status: "En retard",
    leaseEnd: "2025-01-31",
  },
    {
    id: "T005",
    name: "David Leroy",
    email: "david.leroy@example.com",
    phone: "+32460123456",
    nationalId: "80.02.29-444.55",
    property: "Condo 3, Place Saint-Lambert 1, 4000 Liège",
    status: "Actif",
    leaseEnd: "2024-11-30",
  },
];

export default function TenantsPage() {
  const [tenants, setTenants] = useState(initialTenants);
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    email: "",
    phone: "",
    nationalId: "",
    property: "",
    leaseEnd: "",
  });

  const handleAddTenant = () => {
    setTenants(prev => [...prev, {
      id: `T${String(prev.length + 1).padStart(3, '0')}`,
      ...newTenant,
      status: "Actif"
    }]);
    setNewTenant({ name: "", email: "", phone: "", nationalId: "", property: "", leaseEnd: "" });
    setIsAddTenantOpen(false);
  }

  const handleDeleteTenant = (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
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
