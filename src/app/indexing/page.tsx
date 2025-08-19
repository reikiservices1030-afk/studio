
'use client';

import { useState } from 'react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calculator, Euro, TrendingUp } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const indexationSchema = z.object({
  baseRent: z.coerce.number().positive("Le loyer de base doit être un nombre positif."),
  startIndex: z.coerce.number().positive("L'indice de départ doit être un nombre positif."),
  newIndex: z.coerce.number().positive("Le nouvel indice doit être un nombre positif."),
});

type IndexationForm = z.infer<typeof indexationSchema>;

export default function IndexingPage() {
  const [indexedRent, setIndexedRent] = useState<number | null>(null);

  const form = useForm<IndexationForm>({
    resolver: zodResolver(indexationSchema),
  });

  const onSubmit = (data: IndexationForm) => {
    const { baseRent, startIndex, newIndex } = data;
    const newRent = (baseRent * newIndex) / startIndex;
    setIndexedRent(newRent);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Indexation des loyers" />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-2 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Calculator /> Calculateur d'indexation
              </CardTitle>
              <CardDescription>
                Calculez le loyer indexé selon la loi belge. La formule est : (Loyer de base x Nouvel indice) / Indice de départ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="baseRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loyer de base (hors charges)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="800.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startIndex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indice santé de départ</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="Indice du mois précédant la signature du bail" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newIndex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouvel indice santé</FormLabel>
                        <FormControl>
                           <Input type="number" step="0.01" placeholder="Indice du mois précédant l'anniversaire du bail" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Calculer</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <div className="space-y-6">
             <Card className="flex-1 flex flex-col justify-center items-center">
                <CardHeader className="items-center pb-2">
                    <CardTitle className="text-sm font-medium">Nouveau loyer indexé</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    {indexedRent !== null ? (
                        <>
                            <div className="text-5xl font-bold text-primary">
                                {indexedRent.toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">par mois</p>
                        </>
                    ) : (
                         <div className="text-center text-muted-foreground p-8">
                            <Euro className="h-12 w-12 mx-auto"/>
                            <p className="mt-2">Le résultat s'affichera ici.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertTitle>Comment ça fonctionne ?</AlertTitle>
              <AlertDescription>
                L'indexation du loyer est une augmentation annuelle légale pour ajuster le loyer au coût de la vie. Elle ne peut être appliquée qu'une fois par an, à la date anniversaire de l'entrée en vigueur du contrat de bail. Vous devez en informer le locataire par écrit.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
