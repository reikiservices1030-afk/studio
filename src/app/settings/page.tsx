
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { db } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from 'lucide-react';

const ownerInfoSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  address: z.string().min(1, 'L\'adresse est requise'),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional(),
  bankAccount: z.string().optional(),
  companyNumber: z.string().optional(),
});

type OwnerInfo = z.infer<typeof ownerInfoSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<OwnerInfo>({
    resolver: zodResolver(ownerInfoSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      bankAccount: '',
      companyNumber: '',
    },
  });

  useEffect(() => {
    const ownerInfoRef = ref(db, 'ownerInfo');
    const unsubscribe = onValue(ownerInfoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        form.reset(data);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [form]);

  const onSubmit = async (data: OwnerInfo) => {
    setSaving(true);
    try {
      await set(ref(db, 'ownerInfo'), data);
      toast({
        title: "Succès",
        description: "Vos informations ont été enregistrées.",
      });
    } catch (error) {
      console.error("Error saving owner info:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer les informations.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Paramètres">
        <Button size="sm" className="gap-1" onClick={form.handleSubmit(onSubmit)} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="font-headline">Informations du Propriétaire</CardTitle>
            <CardDescription>
              Ces informations seront utilisées pour générer les baux, les quittances et autres documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet ou nom de la société</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Jean Dupont" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse complète</FormLabel>
                      <FormControl>
                        <Textarea placeholder="ex: 123 Rue de la Loi, 1000 Bruxelles, Belgique" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                            <Input placeholder="+32 4xx xx xx xx" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="contact@exemple.be" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="bankAccount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Numéro de compte bancaire (IBAN)</FormLabel>
                        <FormControl>
                            <Input placeholder="BE12 3456 7890 1234" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="companyNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Numéro d'entreprise (BCE)</FormLabel>
                        <FormControl>
                            <Input placeholder="0123.456.789" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              </form>
            </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
