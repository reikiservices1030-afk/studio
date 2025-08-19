
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  PlusCircle,
  Loader2,
  Eye,
  Edit,
  FileText,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db, storage } from '@/lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  DocumentData,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { Tenant, Property } from '@/types';


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

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Partial<Tenant>>({});
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    const unsubTenants = onSnapshot(collection(db, 'tenants'), (snapshot) => {
      const tenantsData: Tenant[] = [];
      snapshot.forEach((doc: DocumentData) => {
        tenantsData.push({ id: doc.id, ...doc.data() } as Tenant);
      });
      setTenants(tenantsData);
      setLoading(false);
    });

    const unsubProperties = onSnapshot(collection(db, 'properties'), (snapshot) => {
        const propsData: Property[] = [];
        snapshot.forEach((doc: DocumentData) => {
            propsData.push({ id: doc.id, ...doc.data() } as Property);
        });
        setProperties(propsData);
    });

    return () => {
        unsubTenants();
        unsubProperties();
    };
  }, []);

  // Camera Permission Effect
  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      if (!isCameraOpen) {
          if (videoRef.current?.srcObject) {
              const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
              tracks.forEach(track => track.stop());
              videoRef.current.srcObject = null;
          }
          return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Accès à la caméra refusé',
          description: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
        });
      }
    };
    getCameraPermission();
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [isCameraOpen, toast]);
  

  const resetDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentTenant({});
    setIdCardFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdCardFile(e.target.files[0]);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
        canvasRef.current.toBlob(blob => {
          if (blob) {
            const file = new File([blob], `id_card.png`, { type: 'image/png' });
            setIdCardFile(file);
            toast({title: "Photo capturée", description: "La photo de la carte d'identité a été prise."});
            setIsCameraOpen(false);
          }
        }, 'image/png');
      }
    }
  };

  const handleSave = async () => {
    const { firstName, lastName, email, propertyId, leaseStart, leaseDuration, nationalId } = currentTenant;
    if (!firstName || !lastName || !email || !propertyId || !leaseStart || !leaseDuration || !nationalId) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires (y compris le N° National).',
      });
      return;
    }
    setUploading(true);

    let idCardUrl = currentTenant.idCardUrl || '';
    let idCardPath = currentTenant.idCardPath || '';

    try {
        if (idCardFile) {
            if (isEditing && currentTenant.idCardPath) {
                const oldImageRef = ref(storage, currentTenant.idCardPath);
                await deleteObject(oldImageRef).catch(err => console.error("Could not delete old image", err));
            }
            const fileExtension = idCardFile.name.split('.').pop();
            const newImagePath = `id_cards/${nationalId}.${fileExtension}`;
            const storageRef = ref(storage, newImagePath);
            await uploadBytes(storageRef, idCardFile);
            idCardUrl = await getDownloadURL(storageRef);
            idCardPath = newImagePath;
        }

        const selectedProperty = properties.find(p => p.id === propertyId);

        const tenantData: Omit<Tenant, 'id'> = {
            firstName: currentTenant.firstName || '',
            lastName: currentTenant.lastName || '',
            email: currentTenant.email || '',
            phone: currentTenant.phone || '',
            nationalId: currentTenant.nationalId || '',
            nationality: currentTenant.nationality || '',
            bankAccount: currentTenant.bankAccount || '',
            propertyId: currentTenant.propertyId || '',
            leaseStart: currentTenant.leaseStart || '',
            leaseDuration: currentTenant.leaseDuration || 0,
            idCardUrl,
            idCardPath,
            status: 'Actif',
            propertyName: selectedProperty?.address || 'N/A',
        };

        if (isEditing && currentTenant.id) {
            const tenantRef = doc(db, 'tenants', currentTenant.id);
            await updateDoc(tenantRef, tenantData);
            toast({ title: 'Succès', description: 'Locataire mis à jour.' });
        } else {
            await addDoc(collection(db, 'tenants'), tenantData);
            toast({ title: 'Succès', description: 'Nouveau locataire ajouté.' });
        }
        resetDialog();
    } catch (error) {
        console.error('Error saving tenant:', error);
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'enregistrer le locataire." });
    } finally {
        setUploading(false);
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce locataire ?')) {
      try {
        if (tenant.idCardPath) {
          const imageRef = ref(storage, tenant.idCardPath);
          await deleteObject(imageRef);
        }
        await deleteDoc(doc(db, 'tenants', tenant.id));
        toast({ title: 'Succès', description: 'Locataire supprimé.' });
      } catch (error)
        {
        console.error('Error deleting tenant:', error);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer le locataire.' });
      }
    }
  };
  
  const openEditDialog = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    setIsEditing(true);
    setIsDialogOpen(true);
  };
  
  const openViewDialog = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    setIsViewOpen(true);
  };

  const sendMessage = (tenant: Tenant) => {
    if (!tenant.phone) {
        toast({ variant: "destructive", title: "Erreur", description: "Numéro de téléphone manquant."});
        return;
    }
    const message = `Bonjour ${tenant.firstName}, `;
    const whatsappUrl = `https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const generateLease = (tenant: Tenant) => {
    const property = properties.find(p => p.id === tenant.propertyId);
    if (!property) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Propriété associée non trouvée.' });
      return;
    }

    const leaseEndDate = new Date(tenant.leaseStart);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + tenant.leaseDuration);

    const leaseContent = `
      <html>
        <head><title>Contrat de Bail</title><style>body { font-family: 'Times New Roman', serif; margin: 2rem; line-height: 1.6; } h1, h2 { text-align: center; } .section { margin-top: 2rem; } .signature-area { margin-top: 4rem; display: flex; justify-content: space-between; } .signature { width: 45%; border-top: 1px solid #000; padding-top: 0.5rem; }</style></head>
        <body>
          <h1>CONTRAT DE BAIL RÉSIDENTIEL</h1>
          <div class="section">
            <h2>ENTRE LES SOUSSIGNÉS :</h2>
            <p><strong>Le Bailleur :</strong> [Nom du propriétaire], demeurant à [Adresse du propriétaire], ci-après dénommé "le Bailleur".</p>
            <p><strong>Le Locataire :</strong> ${tenant.firstName} ${tenant.lastName}, N° National : ${tenant.nationalId}, nationalité: ${tenant.nationality}, ci-après dénommé "le Locataire".</p>
          </div>
          <div class="section">
            <h2>IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :</h2>
            <p>Le Bailleur loue au Locataire, qui accepte, le bien immobilier suivant :</p>
            <p><strong>Désignation du bien :</strong> ${property.address}</p>
            <p><strong>Usage du bien :</strong> Le bien est loué à usage exclusif d'habitation principale.</p>
          </div>
          <div class="section">
            <h2>DURÉE DU BAIL</h2>
            <p>Le présent bail est consenti pour une durée de ${tenant.leaseDuration} mois, à compter du ${new Date(tenant.leaseStart).toLocaleDateString('fr-BE')} pour se terminer le ${leaseEndDate.toLocaleDateString('fr-BE')}, sauf reconduction ou résiliation anticipée.</p>
          </div>
           <div class="section">
            <h2>LOYER ET CHARGES</h2>
            <p>Le loyer mensuel est fixé à ${property.rent.toFixed(2)} € (${property.rent} euros), payable par le Locataire au Bailleur avant le 5 de chaque mois.</p>
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
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Locataires">
        <Button size="sm" className="gap-1" onClick={() => { setIsEditing(false); setCurrentTenant({}); setIsDialogOpen(true); }}>
          <PlusCircle className="h-3.5 w-3.5" />
          Ajouter un locataire
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Gestion des locataires</CardTitle>
            <CardDescription>Consultez, ajoutez et gérez vos locataires.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden md:table-cell">Propriété</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="font-medium">{tenant.firstName} {tenant.lastName}</div>
                        <div className="text-sm text-muted-foreground">{tenant.email}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{tenant.propertyName}</TableCell>
                      <TableCell><Badge variant={tenant.status === 'Actif' ? 'secondary' : 'destructive'}>{tenant.status}</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Menu</span></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openViewDialog(tenant)}><Eye className="mr-2 h-4 w-4" />Voir les détails</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sendMessage(tenant)}><WhatsappIcon /><span className="ml-2">Envoyer un message</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(tenant)}><Edit className="mr-2 h-4 w-4" />Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => generateLease(tenant)}><FileText className="mr-2 h-4 w-4" />Générer le bail</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(tenant)}><Trash2 className="mr-2 h-4 w-4"/>Supprimer</DropdownMenuItem>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Modifier le locataire' : 'Ajouter un locataire'}</DialogTitle>
            <DialogDescription>Remplissez les informations du locataire ci-dessous.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Prénom</Label><Input value={currentTenant.firstName || ''} onChange={(e) => setCurrentTenant({...currentTenant, firstName: e.target.value})} /></div>
                <div className="space-y-2"><Label>Nom</Label><Input value={currentTenant.lastName || ''} onChange={(e) => setCurrentTenant({...currentTenant, lastName: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={currentTenant.email || ''} onChange={(e) => setCurrentTenant({...currentTenant, email: e.target.value})} /></div>
            <div className="space-y-2"><Label>Téléphone</Label><Input type="tel" value={currentTenant.phone || ''} onChange={(e) => setCurrentTenant({...currentTenant, phone: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>N° National</Label><Input value={currentTenant.nationalId || ''} onChange={(e) => setCurrentTenant({...currentTenant, nationalId: e.target.value})} /></div>
                <div className="space-y-2"><Label>Nationalité</Label><Input value={currentTenant.nationality || ''} onChange={(e) => setCurrentTenant({...currentTenant, nationality: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>N° Compte Bancaire</Label><Input value={currentTenant.bankAccount || ''} onChange={(e) => setCurrentTenant({...currentTenant, bankAccount: e.target.value})} /></div>
            <div className="space-y-2">
                <Label>Propriété à louer</Label>
                <Select value={currentTenant.propertyId} onValueChange={(value) => setCurrentTenant({...currentTenant, propertyId: value})}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez une propriété" /></SelectTrigger>
                    <SelectContent>
                        {properties.map(p => (<SelectItem key={p.id} value={p.id}>{p.address} - {p.rent}€</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date de début du bail</Label><Input type="date" value={currentTenant.leaseStart || ''} onChange={(e) => setCurrentTenant({...currentTenant, leaseStart: e.target.value})} /></div>
                <div className="space-y-2"><Label>Durée du bail (mois)</Label><Input type="number" value={currentTenant.leaseDuration || ''} onChange={(e) => setCurrentTenant({...currentTenant, leaseDuration: Number(e.target.value)})} /></div>
            </div>
            <div className="space-y-2">
                <Label>Carte d'identité</Label>
                <div className="flex gap-2">
                    <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Télécharger</Button>
                    <Button variant="outline" className="w-full" onClick={() => setIsCameraOpen(true)}><Camera className="mr-2 h-4 w-4"/>Prendre une photo</Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
                {idCardFile && <p className="text-sm text-muted-foreground">Fichier sélectionné: {idCardFile.name}</p>}
                {!idCardFile && currentTenant.idCardUrl && <p className="text-sm text-muted-foreground">Une image est déjà enregistrée.</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" onClick={resetDialog}>Annuler</Button></DialogClose>
            <Button onClick={handleSave} disabled={uploading}>{uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Sauvegarde...</> : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-[500px]">
              <DialogHeader><DialogTitle>Détails du locataire</DialogTitle></DialogHeader>
              {currentTenant && (
                  <div className="grid gap-4 py-4 text-sm max-h-[60vh] overflow-y-auto pr-4">
                      {currentTenant.idCardUrl && <Image src={currentTenant.idCardUrl} alt="ID Card" width={400} height={250} className="rounded-md object-contain mx-auto" />}
                      <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground">Nom:</div><div className="col-span-2 font-medium">{currentTenant.firstName} {currentTenant.lastName}</div></div>
                      <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground">Email:</div><div className="col-span-2 font-medium">{currentTenant.email}</div></div>
                      <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground">Téléphone:</div><div className="col-span-2 font-medium">{currentTenant.phone}</div></div>
                      <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground">N° National:</div><div className="col-span-2 font-medium">{currentTenant.nationalId}</div></div>
                      <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground">Nationalité:</div><div className="col-span-2 font-medium">{currentTenant.nationality}</div></div>
                      <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground">Compte bancaire:</div><div className="col-span-2 font-medium">{currentTenant.bankAccount}</div></div>
                      <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground">Propriété:</div><div className="col-span-2 font-medium">{currentTenant.propertyName}</div></div>
                      <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground">Début du bail:</div><div className="col-span-2 font-medium">{currentTenant.leaseStart}</div></div>
                      <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground">Durée:</div><div className="col-span-2 font-medium">{currentTenant.leaseDuration} mois</div></div>
                      <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground">Statut:</div><div className="col-span-2 font-medium"><Badge variant={currentTenant.status === 'Actif' ? 'secondary' : 'destructive'}>{currentTenant.status}</Badge></div></div>
                  </div>
              )}
              <DialogFooter><DialogClose asChild><Button variant="outline">Fermer</Button></DialogClose></DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>Prendre une photo de la carte d'identité</DialogTitle></DialogHeader>
              <div className="py-4">
                  <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
                  <canvas ref={canvasRef} className="hidden" />
                  {hasCameraPermission === false && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertTitle>Accès Caméra Requis</AlertTitle>
                        <AlertDescription>Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.</AlertDescription>
                    </Alert>
                  )}
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCameraOpen(false)}>Annuler</Button>
                  <Button onClick={capturePhoto} disabled={!hasCameraPermission}>Capturer</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
