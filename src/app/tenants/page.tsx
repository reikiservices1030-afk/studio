
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
import { MoreHorizontal, PlusCircle, Loader2, MessageSquare, Eye, Edit, FileText } from "lucide-react";
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
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, DocumentData } from "firebase/firestore";
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

const WhatsappIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
);


export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [isEditTenantOpen, setIsEditTenantOpen] = useState(false);
  const [isViewTenantOpen, setIsViewTenantOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
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

  const handleEditTenant = async () => {
    if (!selectedTenant) return;
     if (!selectedTenant.name || !selectedTenant.email) {
       toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Le nom et l'email sont obligatoires.",
      });
      return;
    }
    try {
      const tenantRef = doc(db, "tenants", selectedTenant.id);
      await updateDoc(tenantRef, {
        name: selectedTenant.name,
        email: selectedTenant.email,
        phone: selectedTenant.phone,
        nationalId: selectedTenant.nationalId,
        property: selectedTenant.property,
        leaseEnd: selectedTenant.leaseEnd,
      });
      setIsEditTenantOpen(false);
      setSelectedTenant(null);
      toast({
        title: "Succès",
        description: "Informations du locataire mises à jour.",
      });
    } catch (error) {
       console.error("Error updating tenant: ", error);
       toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le locataire.",
      });
    }
  };
  
  const openEditDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsEditTenantOpen(true);
  };

  const openViewDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsViewTenantOpen(true);
  }

  const sendMessage = (tenant: Tenant) => {
    if (!tenant.phone) {
      toast({ variant: "destructive", title: "Erreur", description: "Numéro de téléphone manquant."});
      return;
    }
    const message = `Bonjour ${tenant.name}, `;
    const whatsappUrl = `https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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

  const handleGenerateLease = (tenant: Tenant) => {
    const leaseContent = `
      <html>
        <head>
          <title>Contrat de Bail</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 2rem; line-height: 1.6; }
            h1, h2 { text-align: center; }
            p { margin: 1rem 0; }
            .section { margin-top: 2rem; }
            .signature-area { margin-top: 4rem; display: flex; justify-content: space-between; }
            .signature { width: 45%; border-top: 1px solid #000; padding-top: 0.5rem; }
          </style>
        </head>
        <body>
          <h1>CONTRAT DE BAIL RÉSIDENTIEL</h1>
          <div class="section">
            <h2>ENTRE LES SOUSSIGNÉS :</h2>
            <p><strong>Le Bailleur :</strong> [Nom du propriétaire], demeurant à [Adresse du propriétaire], ci-après dénommé "le Bailleur".</p>
            <p><strong>Le Locataire :</strong> ${tenant.name}, Numéro National : ${tenant.nationalId}, demeurant actuellement à [Adresse actuelle du locataire], ci-après dénommé "le Locataire".</p>
          </div>
          <div class="section">
            <h2>IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :</h2>
            <p>Le Bailleur loue au Locataire, qui accepte, le bien immobilier suivant :</p>
            <p><strong>Désignation du bien :</strong> ${tenant.property}</p>
            <p><strong>Usage du bien :</strong> Le bien est loué à usage exclusif d'habitation principale.</p>
          </div>
          <div class="section">
            <h2>DURÉE DU BAIL</h2>
            <p>Le présent bail est consenti pour une durée de [Nombre d'années] ans, à compter du [Date de début] pour se terminer le ${tenant.leaseEnd}, sauf reconduction ou résiliation anticipée dans les conditions prévues par la loi.</p>
          </div>
           <div class="section">
            <h2>LOYER ET CHARGES</h2>
            <p>Le loyer mensuel est fixé à [Montant du loyer en chiffres] € ([Montant en lettres] euros), payable par le Locataire au Bailleur avant le 5 de chaque mois.</p>
            <p>En sus du loyer, le Locataire s'acquittera d'une provision sur charges mensuelle de [Montant des charges] €.</p>
          </div>
          <div class="signature-area">
            <div class="signature">Fait à Bruxelles, le ${new Date().toLocaleDateString('fr-BE')}<br/><br/><strong>Le Bailleur</strong></div>
            <div class="signature">Fait à Bruxelles, le ${new Date().toLocaleDateString('fr-BE')}<br/><br/><strong>Le Locataire</strong></div>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(leaseContent);
    printWindow?.document.close();
    printWindow?.print();
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
                          <DropdownMenuItem onClick={() => openViewDialog(tenant)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => sendMessage(tenant)}>
                            <WhatsappIcon />
                            <span className="ml-2">Envoyer un message</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(tenant)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateLease(tenant)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Générer le bail
                          </DropdownMenuItem>
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

      {/* Add Tenant Dialog */}
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
      
      {/* Edit Tenant Dialog */}
      <Dialog open={isEditTenantOpen} onOpenChange={setIsEditTenantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les informations du locataire</DialogTitle>
            <DialogDescription>
              Mettez à jour les détails ci-dessous.
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name-edit" className="text-right">Nom</Label>
                <Input id="name-edit" value={selectedTenant.name} onChange={(e) => setSelectedTenant({...selectedTenant, name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email-edit" className="text-right">Email</Label>
                <Input id="email-edit" value={selectedTenant.email} onChange={(e) => setSelectedTenant({...selectedTenant, email: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone-edit" className="text-right">Téléphone</Label>
                <Input id="phone-edit" value={selectedTenant.phone} onChange={(e) => setSelectedTenant({...selectedTenant, phone: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nationalId-edit" className="text-right">N° National</Label>
                <Input id="nationalId-edit" value={selectedTenant.nationalId} onChange={(e) => setSelectedTenant({...selectedTenant, nationalId: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="property-edit" className="text-right">Propriété</Label>
                <Input id="property-edit" value={selectedTenant.property} onChange={(e) => setSelectedTenant({...selectedTenant, property: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="leaseEnd-edit" className="text-right">Fin du bail</Label>
                <Input id="leaseEnd-edit" type="date" value={selectedTenant.leaseEnd} onChange={(e) => setSelectedTenant({...selectedTenant, leaseEnd: e.target.value})} className="col-span-3" />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleEditTenant}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Tenant Dialog */}
      <Dialog open={isViewTenantOpen} onOpenChange={setIsViewTenantOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Détails du locataire</DialogTitle>
              </DialogHeader>
              {selectedTenant && (
                  <div className="grid gap-4 py-4 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                          <p className="text-muted-foreground">Nom:</p>
                          <p className="col-span-2 font-medium">{selectedTenant.name}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                          <p className="text-muted-foreground">Email:</p>
                          <p className="col-span-2 font-medium">{selectedTenant.email}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                          <p className="text-muted-foreground">Téléphone:</p>
                          <p className="col-span-2 font-medium">{selectedTenant.phone}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                          <p className="text-muted-foreground">N° National:</p>
                          <p className="col-span-2 font-medium">{selectedTenant.nationalId}</p>
                      </div>
                       <div className="grid grid-cols-3 gap-2">
                          <p className="text-muted-foreground">Propriété:</p>
                          <p className="col-span-2 font-medium">{selectedTenant.property}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                          <p className="text-muted-foreground">Fin du bail:</p>
                          <p className="col-span-2 font-medium">{selectedTenant.leaseEnd}</p>
                      </div>
                       <div className="grid grid-cols-3 gap-2">
                          <p className="text-muted-foreground">Statut:</p>
                           <p className="col-span-2 font-medium"> <Badge variant={selectedTenant.status === 'Actif' ? 'secondary' : 'destructive'}>{selectedTenant.status}</Badge></p>
                      </div>
                  </div>
              )}
              <DialogFooter>
                  <DialogClose asChild>
                      <Button variant="outline">Fermer</Button>
                  </DialogClose>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
