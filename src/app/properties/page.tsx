
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
import { PlusCircle, Loader2, Upload, MoreHorizontal, Trash2, Edit } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

type Property = {
  id: string;
  address: string;
  rent: number;
  imageUrl: string;
  imagePath: string;
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProperty, setCurrentProperty] = useState<Partial<Property>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'properties'),
      (snapshot) => {
        const propsData: Property[] = [];
        snapshot.forEach((doc: DocumentData) => {
          propsData.push({ id: doc.id, ...doc.data() } as Property);
        });
        setProperties(propsData);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const resetDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentProperty({});
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!currentProperty.address || !currentProperty.rent) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs.',
      });
      return;
    }
    setUploading(true);

    let imageUrl = currentProperty.imageUrl || '';
    let imagePath = currentProperty.imagePath || '';

    try {
      if (imageFile) {
        // If it's an edit and there's an old image, delete it
        if (isEditing && currentProperty.imagePath) {
            const oldImageRef = ref(storage, currentProperty.imagePath);
            await deleteObject(oldImageRef).catch(err => console.error("Could not delete old image, may not exist", err));
        }

        const newImagePath = `properties/${Date.now()}_${imageFile.name}`;
        const storageRef = ref(storage, newImagePath);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
        imagePath = newImagePath;
      }

      const propertyData = {
        address: currentProperty.address,
        rent: Number(currentProperty.rent),
        imageUrl,
        imagePath,
      };

      if (isEditing && currentProperty.id) {
        const propertyRef = doc(db, 'properties', currentProperty.id);
        await updateDoc(propertyRef, propertyData);
        toast({ title: 'Succès', description: 'Propriété mise à jour.' });
      } else {
        await addDoc(collection(db, 'properties'), propertyData);
        toast({ title: 'Succès', description: 'Propriété ajoutée.' });
      }
      resetDialog();
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'enregistrer la propriété.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (property: Property) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) {
      try {
        if (property.imagePath) {
          const imageRef = ref(storage, property.imagePath);
          await deleteObject(imageRef);
        }
        await deleteDoc(doc(db, 'properties', property.id));
        toast({ title: 'Succès', description: 'Propriété supprimée.' });
      } catch (error) {
        console.error('Error deleting property:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de supprimer la propriété.',
        });
      }
    }
  };
  
  const openEditDialog = (property: Property) => {
    setCurrentProperty(property);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Propriétés">
        <Button
          size="sm"
          className="gap-1"
          onClick={() => {
            setIsEditing(false);
            setCurrentProperty({});
            setIsDialogOpen(true);
          }}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Ajouter une propriété
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Gérer vos propriétés
            </CardTitle>
            <CardDescription>
              Ajoutez, modifiez et consultez vos biens immobiliers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {properties.map((prop) => (
                  <Card key={prop.id} className="overflow-hidden">
                    <div className="relative h-48 w-full">
                      <Image
                        src={prop.imageUrl || 'https://placehold.co/600x400.png'}
                        alt={prop.address}
                        fill
                        className="object-cover"
                        data-ai-hint="apartment building"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold">{prop.address}</p>
                            <p className="text-primary font-bold text-lg">{prop.rent} € / mois</p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(prop)}>
                                    <Edit className="mr-2 h-4 w-4"/> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(prop)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4"/> Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Modifier la propriété' : 'Ajouter une propriété'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les détails de la propriété ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={currentProperty.address || ''}
                onChange={(e) =>
                  setCurrentProperty({ ...currentProperty, address: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent">Loyer mensuel (€)</Label>
              <Input
                id="rent"
                type="number"
                value={currentProperty.rent || ''}
                onChange={(e) =>
                  setCurrentProperty({ ...currentProperty, rent: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <Input id="image" type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetDialog}>Annuler</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
