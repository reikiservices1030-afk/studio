'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AnalyzeRentalMarketInput, AnalyzeRentalMarketOutput } from '@/ai/flows/analyze-rental-market';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, DollarSign, BarChart, Home } from 'lucide-react';

const formSchema = z.object({
  propertyType: z.string().min(1, 'Le type de propriété est requis'),
  location: z.string().min(1, 'La localisation est requise'),
  bedrooms: z.coerce.number().min(0, 'Le nombre de chambres doit être de 0 ou plus'),
  bathrooms: z.coerce.number().min(1, 'Le nombre de salles de bain doit être de 1 ou plus'),
  squareFootage: z.coerce.number().min(1, 'La superficie est requise'),
  amenities: z.string().min(1, 'Veuillez lister au moins une commodité'),
});

type AnalysisClientProps = {
  runAnalysis: (data: AnalyzeRentalMarketInput) => Promise<{
    success: boolean;
    data?: AnalyzeRentalMarketOutput;
    error?: string;
  }>;
};

export function AnalysisClient({ runAnalysis }: AnalysisClientProps) {
  const [result, setResult] = useState<AnalyzeRentalMarketOutput | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyType: 'Appartement',
      location: 'Paris, France',
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 80,
      amenities: 'Lave-linge, parking, salle de sport',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setResult(null);
    const response = await runAnalysis(values);
    setIsSubmitting(false);

    if (response.success && response.data) {
      setResult(response.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Échec de l\'analyse',
        description: response.error || 'Une erreur inattendue est survenue.',
      });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Bot /> Analyse du marché par IA
            </CardTitle>
            <CardDescription>
              Entrez les détails de la propriété pour obtenir une analyse du marché locatif et une estimation du loyer par IA.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localisation</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Paris, France" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de propriété</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Appartement, Maison" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chambres</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salles de bain</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="squareFootage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Superficie (m²)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="amenities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commodités clés</FormLabel>
                      <FormControl>
                        <Textarea placeholder="ex: Lave-linge, parking, salle de sport" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    'Analyser le marché'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
      <div className="lg:col-span-3">
        <Card className="min-h-full">
          <CardHeader>
            <CardTitle className="font-headline">Résultats de l'analyse</CardTitle>
            <CardDescription>
              L'analyse générée par l'IA apparaîtra ci-dessous.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitting && (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                    <p className="font-semibold">Notre IA analyse le marché...</p>
                    <p className="text-sm">Cela peut prendre quelques instants. Veuillez patienter.</p>
                </div>
            )}
            {!isSubmitting && !result && (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-4 border-2 border-dashed rounded-lg">
                    <Bot className="h-12 w-12"/>
                    <p className="font-semibold">Prêt pour votre analyse</p>
                    <p className="text-sm">Remplissez le formulaire et cliquez sur "Analyser le marché" pour commencer.</p>
                </div>
            )}
            {result && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Loyer mensuel estimé</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      ${result.estimatedRent.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><BarChart className="h-5 w-5 text-accent"/>Tendances du marché</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.marketTrends}</p>
                </div>
                 <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Home className="h-5 w-5 text-accent"/>Propriétés comparables</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.comparableProperties}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
