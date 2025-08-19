
'use client';

import { useState, useRef, useEffect } from 'react';
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
import { MoreHorizontal, Upload, FileText, FileSpreadsheet, FileImage, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, DocumentData } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";

type Document = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded: string;
  url: string;
  path: string;
};

const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return <FileText className="h-5 w-5 text-muted-foreground" />;
    if (fileName.endsWith('.xlsx')) return <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />;
    if (fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.jpeg')) return <FileImage className="h-5 w-5 text-muted-foreground" />;
    return <FileText className="h-5 w-5 text-muted-foreground" />;
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
      const unsubscribe = onSnapshot(collection(db, "documents"), (snapshot) => {
        const docsData: Document[] = [];
        snapshot.forEach((doc: DocumentData) => {
          docsData.push({ id: doc.id, ...doc.data() } as Document);
        });
        setDocuments(docsData.sort((a,b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime()));
        setLoading(false);
      });
      return () => unsubscribe();
    }, []);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    }
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const storagePath = `documents/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, storagePath);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                await addDoc(collection(db, "documents"), {
                    name: file.name,
                    type: file.type,
                    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                    uploaded: new Date().toISOString().split('T')[0],
                    url: downloadURL,
                    path: storagePath,
                });

                toast({ title: "Succès", description: "Document téléchargé." });
            } catch (error) {
                console.error("Error uploading file:", error);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de télécharger le document." });
            } finally {
                setUploading(false);
                // Reset file input
                if(fileInputRef.current) fileInputRef.current.value = "";
            }
        }
    }
    
    const handleDelete = async (docToDelete: Document) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
            try {
                // Delete file from storage
                const fileRef = ref(storage, docToDelete.path);
                await deleteObject(fileRef);

                // Delete doc from firestore
                await deleteDoc(doc(db, "documents", docToDelete.id));

                toast({ title: "Succès", description: "Document supprimé." });

            } catch (error) {
                console.error("Error deleting document:", error);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le document." });
            }
        }
    }

  return (
    <div className="flex flex-col h-full">
      <Header title="Documents">
        <Button size="sm" className="gap-1" onClick={handleUploadClick} disabled={uploading}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? 'Téléchargement...' : 'Télécharger un document'}
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Stockage de documents</CardTitle>
            <CardDescription>
              Stockez et gérez en toute sécurité tous vos documents importants.
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
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Taille</TableHead>
                  <TableHead>Téléchargé le</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.name)}
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{doc.name}</a>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{doc.type}</TableCell>
                    <TableCell className="hidden sm:table-cell">{doc.size}</TableCell>
                    <TableCell>{doc.uploaded}</TableCell>
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
                          <DropdownMenuItem asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">Télécharger</a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(doc.url).then(() => toast({title: 'Lien copié'}))}>
                            Partager
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(doc)}>Supprimer</DropdownMenuItem>
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
    </div>
  );
}
