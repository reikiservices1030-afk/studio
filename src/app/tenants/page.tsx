
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  ShieldCheck,
  Mail,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, onValue, push, remove, update, query, orderByChild, equalTo } from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { Tenant, Property, OwnerInfo, Maintenance, Payment, GroupedPayment } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Separator } from '@/components/ui/separator';


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
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenantMaintenances, setTenantMaintenances] = useState<Maintenance[]>([]);
  const [selectedRepairs, setSelectedRepairs] = useState<Record<string, boolean>>({});
  const [selectedUnpaid, setSelectedUnpaid] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Partial<Tenant>>({});
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { toast } = useToast();

  const unpaidRents = useMemo(() => {
    if (!currentTenant.id) return [];
    const tenantPayments = payments.filter(p => p.tenantId === currentTenant.id && p.type === 'Loyer');
    const groups: { [key: string]: GroupedPayment } = {};
    
    tenantPayments.forEach(p => {
        const groupKey = p.period;
        if (!groups[groupKey]) {
            groups[groupKey] = {
                groupKey,
                tenantId: p.tenantId,
                tenantFirstName: p.tenantFirstName,
                tenantLastName: p.tenantLastName,
                property: p.property,
                type: 'Loyer',
                period: p.period,
                totalDue: p.rentDue,
                totalPaid: 0,
                status: '',
                payments: [],
            };
        }
        if (p.status === 'Payé') {
            groups[groupKey].totalPaid += p.amount;
        }
    });

    return Object.values(groups).filter(g => g.totalPaid < g.totalDue);
  }, [currentTenant.id, payments]);

  
  const totalDeductions = useMemo(() => {
    const repairDeductions = tenantMaintenances.reduce((total, repair) => {
        if (selectedRepairs[repair.id]) {
            return total + repair.cost;
        }
        return total;
    }, 0);
    const unpaidDeductions = unpaidRents.reduce((total, rent) => {
        if(selectedUnpaid[rent.groupKey]){
            return total + (rent.totalDue - rent.totalPaid);
        }
        return total;
    }, 0);
    return repairDeductions + unpaidDeductions;
  }, [selectedRepairs, tenantMaintenances, selectedUnpaid, unpaidRents]);

  const finalRefundAmount = useMemo(() => {
      const deposit = currentTenant?.depositAmount || 0;
      return deposit - totalDeductions;
  }, [currentTenant, totalDeductions]);


  useEffect(() => {
    const tenantsRef = dbRef(db, 'tenants');
    const unsubTenants = onValue(tenantsRef, (snapshot) => {
      const tenantsData: Tenant[] = [];
      const val = snapshot.val();
      if (val) {
        Object.keys(val).forEach((key) => {
          tenantsData.push({ id: key, ...val[key] });
        });
      }
      setTenants(tenantsData);
      setLoading(false);
    });

    const propertiesRef = dbRef(db, 'properties');
    const unsubProperties = onValue(propertiesRef, (snapshot) => {
        const propsData: Property[] = [];
        const val = snapshot.val();
        if (val) {
          Object.keys(val).forEach((key) => {
            propsData.push({ id: key, ...val[key] });
          });
        }
        setProperties(propsData);
    });

     const ownerInfoRef = dbRef(db, 'ownerInfo');
      const unsubOwner = onValue(ownerInfoRef, (snapshot) => {
        setOwnerInfo(snapshot.val());
      });
    
     const paymentsRef = dbRef(db, 'payments');
     const unsubPayments = onValue(paymentsRef, (snapshot) => {
         const data: Payment[] = [];
         snapshot.forEach(child => data.push({id: child.key!, ...child.val()}));
         setPayments(data);
     });

    return () => {
        unsubTenants();
        unsubProperties();
        unsubOwner();
        unsubPayments();
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
    const { firstName, lastName, email, propertyId, leaseStart, leaseDuration, nationalId, paymentDueDay } = currentTenant;
    if (!firstName || !lastName || !email || !propertyId || !leaseStart || !leaseDuration || !nationalId || !paymentDueDay) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires.',
      });
      return;
    }
    setUploading(true);

    let idCardUrl = currentTenant.idCardUrl || '';
    let idCardPath = currentTenant.idCardPath || '';

    try {
        if (idCardFile) {
            if (isEditing && currentTenant.idCardPath) {
                const oldImageRef = storageRef(storage, currentTenant.idCardPath);
                await deleteObject(oldImageRef).catch(err => console.error("Could not delete old image", err));
            }
            const fileExtension = idCardFile.name.split('.').pop();
            const newImagePath = `id_cards/${nationalId}.${fileExtension}`;
            const newImageRef = storageRef(storage, newImagePath);
            await uploadBytes(newImageRef, idCardFile);
            idCardUrl = await getDownloadURL(newImageRef);
            idCardPath = newImagePath;
        }

        const selectedProperty = properties.find(p => p.id === propertyId);
        if (!selectedProperty) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Propriété sélectionnée invalide.' });
            setUploading(false);
            return;
        }

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
            status: currentTenant.status || 'Actif',
            propertyName: selectedProperty?.address || 'N/A',
            rent: selectedProperty.rent,
            paymentDueDay: currentTenant.paymentDueDay || 1,
            depositAmount: currentTenant.depositAmount || 0,
            depositStatus: currentTenant.depositStatus || 'Non payé',
        };

        if (isEditing && currentTenant.id) {
            const tenantRef = dbRef(db, `tenants/${currentTenant.id}`);
            await update(tenantRef, tenantData);
            toast({ title: 'Succès', description: 'Locataire mis à jour.' });
        } else {
            const tenantsRef = dbRef(db, 'tenants');
            await push(tenantsRef, tenantData);
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
          const imageRef = storageRef(storage, tenant.idCardPath);
          await deleteObject(imageRef);
        }
        await remove(dbRef(db, `tenants/${tenant.id}`));
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
  
  const openDepositDialog = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    
    // Fetch maintenances for this tenant
    const maintenancesQuery = query(dbRef(db, 'maintenances'), orderByChild('tenantId'), equalTo(tenant.id));
    onValue(maintenancesQuery, (snapshot) => {
        const data: Maintenance[] = [];
        snapshot.forEach(child => data.push({id: child.key!, ...child.val()}));
        setTenantMaintenances(data);
        
        // Pre-select repairs that were already marked as deducted
        const alreadyDeducted = data.reduce((acc, item) => {
            if(item.deductedFromDeposit) {
                acc[item.id] = true;
            }
            return acc;
        }, {} as Record<string, boolean>);
        setSelectedRepairs(alreadyDeducted);

    }, { onlyOnce: true });

    setIsDepositOpen(true);
  };
  
  const handleDepositSave = async () => {
    if (!currentTenant.id || !currentTenant.depositStatus) return;
    try {
        const updates: any = {};
        updates[`tenants/${currentTenant.id}/depositStatus`] = currentTenant.depositStatus;

        // Update maintenance items
        tenantMaintenances.forEach(repair => {
            const wasDeducted = repair.deductedFromDeposit;
            const isDeducted = selectedRepairs[repair.id] || false;
            if(wasDeducted !== isDeducted) {
                updates[`maintenances/${repair.id}/deductedFromDeposit`] = isDeducted;
            }
        });

        await update(dbRef(db), updates);

        toast({ title: 'Succès', description: 'Statut de la caution mis à jour.' });
        setIsDepositOpen(false);
        setCurrentTenant({});
        setTenantMaintenances([]);
        setSelectedRepairs({});

    } catch(error) {
        console.error('Error updating deposit status:', error);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut.' });
    }
  }

  const sendMessage = (tenant: Tenant, message: string) => {
    if (!tenant.phone) {
        toast({ variant: "destructive", title: "Erreur", description: "Numéro de téléphone manquant."});
        return;
    }
    const whatsappUrl = `https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const sendEmail = (tenant: Tenant, subject: string, body: string) => {
    if (!tenant.email) {
      toast({ variant: "destructive", title: "Erreur", description: "Email du locataire manquant."});
      return;
    }
    const mailtoUrl = `mailto:${tenant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const generateLease = async (tenant: Tenant) => {
    const property = properties.find(p => p.id === tenant.propertyId);
    if (!property || !ownerInfo) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Informations sur la propriété ou le propriétaire manquantes.' });
      return;
    }

    const leaseEndDate = new Date(tenant.leaseStart);
    leaseEndDate.setFullYear(leaseEndDate.getFullYear() + Math.floor((tenant.leaseDuration || 0) / 12));
    leaseEndDate.setMonth(leaseEndDate.getMonth() + ((tenant.leaseDuration || 0) % 12));

    const leaseContent = `
      <html>
        <head>
          <title>Contrat de Bail - ${tenant.lastName}</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 0; padding: 2rem; line-height: 1.6; font-size: 12pt; }
            .container { max-width: 800px; margin: auto; background: white; padding: 2rem;}
            h1, h2, h3 { text-align: center; }
            .section { margin-top: 2rem; text-align: justify; }
            .parties, .signatures { display: flex; justify-content: space-between; margin-top: 2rem; }
            .party, .signature { width: 48%; }
            ul { list-style: none; padding-left: 0; }
            li { margin-bottom: 0.5rem; }
            strong { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>CONTRAT DE BAIL DE RÉSIDENCE PRINCIPALE</h1>
            <h3>(Loi du 20 février 1991 - Code du Logement)</h3>

            <div class="section parties">
              <div class="party">
                <h2>ENTRE :</h2>
                <ul>
                  <li><strong>LE BAILLEUR :</strong></li>
                  <li>${ownerInfo.name}</li>
                  <li>${ownerInfo.address}</li>
                  ${ownerInfo.companyNumber ? `<li>BCE : ${ownerInfo.companyNumber}</li>` : ''}
                </ul>
              </div>
              <div class="party">
                <h2>ET :</h2>
                <ul>
                  <li><strong>LE PRENEUR :</strong></li>
                  <li>${tenant.firstName} ${tenant.lastName}</li>
                  <li>Né(e) le: [Date de naissance]</li>
                  <li>Nationalité : ${tenant.nationality}</li>
                  <li>N° National : ${tenant.nationalId}</li>
                </ul>
              </div>
            </div>
            
            <div class="section">
              <h2>IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :</h2>
              <p>Le Bailleur loue au Preneur, qui accepte, le bien immobilier suivant :</p>
              <p><strong>Désignation du bien :</strong> ${property.address}</p>
              <p>Le bien est loué à usage exclusif d'habitation principale, le Preneur déclare bien connaître les lieux pour les avoir vus et visités.</p>
            </div>

            <div class="section">
              <h2>Article 1 : Durée</h2>
              <p>Le présent bail est consenti pour une durée de ${tenant.leaseDuration} mois, prenant cours le ${new Date(tenant.leaseStart).toLocaleDateString('fr-BE')} pour se terminer le ${leaseEndDate.toLocaleDateString('fr-BE')}.</p>
            </div>

            <div class="section">
              <h2>Article 2 : Loyer</h2>
              <p>Le loyer mensuel est fixé à <strong>${property.rent.toFixed(2)} €</strong> (euros), payable par virement anticipativement pour le ${tenant.paymentDueDay} de chaque mois sur le compte bancaire du bailleur : ${ownerInfo.bankAccount || '[IBAN du bailleur]'}.</p>
              <p>Le loyer sera indexé annuellement à la date anniversaire du bail, sur base de l'indice santé, conformément à la législation en vigueur.</p>
            </div>

            <div class="section">
              <h2>Article 3 : Garantie locative</h2>
              <p>Le Preneur remettra au Bailleur une garantie locative équivalente à deux mois de loyer, soit <strong>${tenant.depositAmount.toFixed(2)} €</strong>. Cette garantie sera constituée sur un compte bloqué au nom des deux parties.</p>
            </div>

            <div class="section signatures">
              <div class="signature">
                  <p>Fait à Bruxelles, le ${new Date().toLocaleDateString('fr-BE')}, en deux exemplaires, chaque partie reconnaissant avoir reçu le sien.</p>
                  <br/><br/>
                  <strong>LE BAILLEUR</strong>
                  <br/><br/>
                  (Signature)
              </div>
              <div class="signature">
                  <br/><br/><br/><br/><br/><br/>
                  <strong>LE PRENEUR</strong>
                  <br/><br/>
                  (Signature)
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const printContainer = document.createElement('div');
    printContainer.innerHTML = leaseContent;
    document.body.appendChild(printContainer);
    
    try {
      toast({ title: "Génération du PDF...", description: "Veuillez patienter." });
      const canvas = await html2canvas(printContainer.querySelector('.container') as HTMLElement);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `Bail-${tenant.lastName}-${tenant.leaseStart}.pdf`;
      pdf.save(fileName);

      toast({ title: "Succès", description: "Bail téléchargé." });

    } catch (error) {
      console.error("Error saving or printing lease:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de générer le bail." });
    } finally {
        document.body.removeChild(printContainer);
    }
  };

  const generateNoticeToQuit = async (tenant: Tenant) => {
    const property = properties.find(p => p.id === tenant.propertyId);
    if (!property || !ownerInfo) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Informations sur la propriété ou le propriétaire manquantes.' });
      return;
    }
    
    const tenantUnpaidRents = unpaidRents.filter(rent => rent.tenantId === tenant.id);
    const totalArrears = tenantUnpaidRents.reduce((acc, rent) => acc + (rent.totalDue - rent.totalPaid), 0);
    const arrearsDetails = tenantUnpaidRents.map(rent => ` - ${rent.period}: ${(rent.totalDue - rent.totalPaid).toFixed(2)} €`).join('\n');

    if (tenantUnpaidRents.length < 2) {
      toast({ variant: 'destructive', title: 'Action non requise', description: 'Une mise en demeure est généralement envoyée après 2 mois de loyers impayés.' });
      return;
    }
    
    const noticeContent = `
      <html>
        <head><title>Mise en Demeure</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 2rem; line-height: 1.6; font-size: 12pt; }
            .container { max-width: 800px; margin: auto; }
            .sender-info { text-align: left; }
            .recipient-info { text-align: right; margin: 2rem 0; }
            .content { text-align: justify; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="sender-info">
                <p class="bold">${ownerInfo.name}</p>
                <p>${ownerInfo.address}</p>
            </div>
            <div class="recipient-info">
                <p class="bold">${tenant.firstName} ${tenant.lastName}</p>
                <p>${property.address}</p>
            </div>
            <p>Fait à [Ville], le ${new Date().toLocaleDateString('fr-BE')}</p>
            <br/>
            <p><span class="bold">OBJET : Mise en demeure pour non-paiement de loyer</span></p>
            <p><span class="bold">Lettre Recommandée avec Accusé de Réception</span></p>
            <br/>
            <p>Madame, Monsieur,</p>
            <div class="content">
                <p>Sauf erreur ou omission de notre part, nous constatons qu'à ce jour, vous n'avez pas réglé les loyers et charges dus pour le logement que vous occupez, situé à l'adresse suivante : ${property.address}.</p>
                <p>Le montant total des arriérés s'élève à ce jour à <span class="bold">${totalArrears.toFixed(2)} €</span>, correspondant aux périodes suivantes :</p>
                <pre>${arrearsDetails}</pre>
                <p>Nous vous mettons donc en demeure de régulariser votre situation en nous faisant parvenir la somme de <span class="bold">${totalArrears.toFixed(2)} €</span> sous un délai de 8 jours à compter de la réception de la présente.</p>
                <p>À défaut de paiement dans le délai imparti, nous nous verrons contraints d'engager une procédure judiciaire à votre encontre afin d'obtenir le recouvrement des sommes dues et la résiliation du bail, avec toutes les conséquences que cela implique (frais de justice, expulsion, etc.).</p>
                <p>Dans l'attente de votre règlement, nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.</p>
            </div>
            <br/><br/>
            <p>Signature</p>
            <br/>
            <p>${ownerInfo.name}</p>
          </div>
        </body>
      </html>
    `;
    
    const printContainer = document.createElement('div');
    printContainer.innerHTML = noticeContent;
    document.body.appendChild(printContainer);
    
    try {
      toast({ title: "Génération du PDF...", description: "Veuillez patienter." });
      const canvas = await html2canvas(printContainer.querySelector('.container') as HTMLElement);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MiseEnDemeure-${tenant.lastName}.pdf`);
      toast({ title: "Succès", description: "Mise en demeure téléchargée." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de générer le document." });
    } finally {
      document.body.removeChild(printContainer);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Locataires">
        <Button size="sm" className="gap-1" onClick={() => { setIsEditing(false); setCurrentTenant({paymentDueDay: 1, depositStatus: 'Non payé', status: 'Actif'}); setIsDialogOpen(true); }}>
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
                            <DropdownMenuItem onClick={() => sendMessage(tenant, `Bonjour ${tenant.firstName}, `)}><WhatsappIcon /><span className="ml-2">Envoyer WhatsApp</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sendEmail(tenant, 'Contact', `Bonjour ${tenant.firstName}, `)}><Mail className="mr-2 h-4 w-4" />Envoyer Email</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDepositDialog(tenant)}><ShieldCheck className="mr-2 h-4 w-4" />Gérer la caution</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(tenant)}><Edit className="mr-2 h-4 w-4" />Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => generateLease(tenant)}><FileText className="mr-2 h-4 w-4" />Télécharger le bail</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => generateNoticeToQuit(tenant)} className="text-amber-600 focus:text-amber-700"><AlertTriangle className="mr-2 h-4 w-4"/>Générer une mise en demeure</DropdownMenuItem>
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
             <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={currentTenant.status} onValueChange={(value) => setCurrentTenant({...currentTenant, status: value})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Inactif">Inactif</SelectItem>
                    </SelectContent>
                </Select>
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
                <Select
                  value={currentTenant.propertyId}
                  onValueChange={(value) => {
                    const selectedProperty = properties.find((p) => p.id === value);
                    setCurrentTenant({
                      ...currentTenant,
                      propertyId: value,
                      depositAmount: selectedProperty ? selectedProperty.rent * 2 : 0,
                    });
                  }}
                >
                    <SelectTrigger><SelectValue placeholder="Sélectionnez une propriété" /></SelectTrigger>
                    <SelectContent>
                        {properties.filter(p => !tenants.some(t => t.propertyId === p.id && t.status === 'Actif' && t.id !== currentTenant.id)).map(p => (<SelectItem key={p.id} value={p.id}>{p.address} - {p.rent}€</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
            {currentTenant.propertyId && (
                <div className="space-y-2">
                    <Label>Caution (2 mois de loyer)</Label>
                    <Input value={currentTenant.depositAmount ? `${currentTenant.depositAmount.toFixed(2)} €` : '0.00 €'} disabled />
                </div>
            )}
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date de début du bail</Label><Input type="date" value={currentTenant.leaseStart || ''} onChange={(e) => setCurrentTenant({...currentTenant, leaseStart: e.target.value})} /></div>
                <div className="space-y-2"><Label>Durée du bail (mois)</Label><Input type="number" value={currentTenant.leaseDuration || ''} onChange={(e) => setCurrentTenant({...currentTenant, leaseDuration: Number(e.target.value)})} /></div>
            </div>
            <div className="space-y-2">
              <Label>Jour du mois pour le paiement du loyer</Label>
              <Input type="number" min="1" max="28" value={currentTenant.paymentDueDay || ''} onChange={(e) => setCurrentTenant({...currentTenant, paymentDueDay: Number(e.target.value)})} />
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
          <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Détails du locataire</DialogTitle><DialogDescription>Informations complètes sur le locataire.</DialogDescription></DialogHeader>
              {currentTenant && (
                  <div className="space-y-4 py-4 text-sm max-h-[70vh] overflow-y-auto pr-4">
                      {currentTenant.idCardUrl && (
                        <div className="relative w-full h-48 mb-4">
                            <Image src={currentTenant.idCardUrl} alt="ID Card" fill className="rounded-md object-contain mx-auto" />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Informations Personnelles</h4>
                        <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2">
                          <div className="text-muted-foreground">Nom</div><div className="font-medium">{currentTenant.firstName} {currentTenant.lastName}</div>
                          <div className="text-muted-foreground">Email</div><div className="font-medium">{currentTenant.email}</div>
                          <div className="text-muted-foreground">Téléphone</div><div className="font-medium">{currentTenant.phone}</div>
                          <div className="text-muted-foreground">N° National</div><div className="font-medium">{currentTenant.nationalId}</div>
                          <div className="text-muted-foreground">Nationalité</div><div className="font-medium">{currentTenant.nationality}</div>
                          <div className="text-muted-foreground">Compte bancaire</div><div className="font-medium">{currentTenant.bankAccount}</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="font-semibold">Informations sur le Bail</h4>
                        <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2">
                          <div className="text-muted-foreground">Propriété</div><div className="font-medium">{currentTenant.propertyName}</div>
                          <div className="text-muted-foreground">Loyer</div><div className="font-medium">{currentTenant.rent?.toFixed(2) || 'N/A'} €</div>
                          <div className="text-muted-foreground">Paiement le</div><div className="font-medium">{currentTenant.paymentDueDay} du mois</div>
                          <div className="text-muted-foreground">Début du bail</div><div className="font-medium">{currentTenant.leaseStart}</div>
                          <div className="text-muted-foreground">Durée</div><div className="font-medium">{currentTenant.leaseDuration} mois</div>
                          <div className="text-muted-foreground">Statut</div><div><Badge variant={currentTenant.status === 'Actif' ? 'secondary' : 'destructive'}>{currentTenant.status}</Badge></div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="font-semibold">Garantie Locative (Caution)</h4>
                        <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2">
                            <div className="text-muted-foreground">Montant</div><div className="font-medium">{currentTenant.depositAmount?.toFixed(2) || 'N/A'} €</div>
                            <div className="text-muted-foreground">Statut</div><div><Badge>{currentTenant.depositStatus}</Badge></div>
                        </div>
                      </div>
                  </div>
              )}
              <DialogFooter><DialogClose asChild><Button variant="outline">Fermer</Button></DialogClose></DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Gérer la caution</DialogTitle>
                <DialogDescription>Mettre à jour le statut de la caution pour {currentTenant.firstName} {currentTenant.lastName}.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <Label>Montant de la caution</Label>
                        <Input value={currentTenant.depositAmount ? `${currentTenant.depositAmount.toFixed(2)} €` : '0.00 €'} disabled />
                    </div>
                    <div>
                        <Label>Statut de la caution</Label>
                         <Select 
                            value={currentTenant.depositStatus} 
                            onValueChange={(value) => setCurrentTenant({...currentTenant, depositStatus: value as Tenant['depositStatus']})}
                        >
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Non payé">Non payé</SelectItem>
                                <SelectItem value="Payé">Payé</SelectItem>
                                <SelectItem value="Remboursé">Remboursé</SelectItem>
                                <SelectItem value="Partiellement remboursé">Partiellement remboursé</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <Separator/>

                 <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500"/> Loyers impayés
                    </h4>
                     {unpaidRents.length > 0 ? (
                        <div className="space-y-2 rounded-md border p-2">
                             {unpaidRents.map(rent => (
                                <div key={rent.groupKey} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <Checkbox 
                                            id={`rent-${rent.groupKey}`}
                                            checked={selectedUnpaid[rent.groupKey] || false}
                                            onCheckedChange={(checked) => setSelectedUnpaid(prev => ({...prev, [rent.groupKey]: !!checked}))}
                                        />
                                        <label htmlFor={`rent-${rent.groupKey}`} className="text-sm">
                                            <p className="font-medium">Loyer impayé - {rent.period}</p>
                                        </label>
                                    </div>
                                    <span className="font-semibold text-sm text-destructive">{(rent.totalDue - rent.totalPaid).toFixed(2)} €</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucun loyer impayé pour ce locataire.</p>
                    )}
                </div>

                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Wrench className="h-4 w-4"/> Déductions pour réparations
                    </h4>
                    {tenantMaintenances.length > 0 ? (
                        <div className="space-y-2 rounded-md border p-2">
                            {tenantMaintenances.map(repair => (
                                <div key={repair.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <Checkbox 
                                            id={`repair-${repair.id}`} 
                                            checked={selectedRepairs[repair.id] || false}
                                            onCheckedChange={(checked) => setSelectedRepairs(prev => ({...prev, [repair.id]: !!checked}))}
                                        />
                                        <label htmlFor={`repair-${repair.id}`} className="text-sm">
                                            <p className="font-medium">{repair.description}</p>
                                            <p className="text-xs text-muted-foreground">{repair.date}</p>
                                        </label>
                                    </div>
                                    <span className="font-semibold text-sm">{repair.cost.toFixed(2)} €</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucune réparation n'est associée à ce locataire.</p>
                    )}
                </div>

                <Separator />

                <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Caution initiale:</span>
                        <span className="font-medium">{currentTenant.depositAmount ? `${currentTenant.depositAmount.toFixed(2)} €` : '0.00 €'}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total déductions:</span>
                        <span className="font-medium text-destructive">- {totalDeductions.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-3 mt-3">
                        <span>Montant final à rembourser:</span>
                        <span className="text-primary">{finalRefundAmount.toFixed(2)} €</span>
                    </div>
                </div>

            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
                <Button onClick={handleDepositSave}>Enregistrer</Button>
            </DialogFooter>
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
