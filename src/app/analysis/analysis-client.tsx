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
  propertyType: z.string().min(1, 'Property type is required'),
  location: z.string().min(1, 'Location is required'),
  bedrooms: z.coerce.number().min(0, 'Bedrooms must be 0 or more'),
  bathrooms: z.coerce.number().min(1, 'Bathrooms must be 1 or more'),
  squareFootage: z.coerce.number().min(1, 'Square footage is required'),
  amenities: z.string().min(1, 'Please list at least one amenity'),
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
      propertyType: 'Apartment',
      location: 'San Francisco, CA',
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 900,
      amenities: 'In-unit laundry, parking, gym',
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
        title: 'Analysis Failed',
        description: response.error || 'An unexpected error occurred.',
      });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Bot /> AI Market Analysis
            </CardTitle>
            <CardDescription>
              Enter property details to get an AI-powered rental market analysis and rent estimation.
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
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Brooklyn, NY" {...field} />
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
                      <FormLabel>Property Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Apartment, House" {...field} />
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
                        <FormLabel>Beds</FormLabel>
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
                        <FormLabel>Baths</FormLabel>
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
                        <FormLabel>Sq. Ft.</FormLabel>
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
                      <FormLabel>Key Amenities</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., In-unit laundry, parking, gym" {...field} />
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
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Market'
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
            <CardTitle className="font-headline">Analysis Results</CardTitle>
            <CardDescription>
              The AI-generated analysis will appear below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitting && (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                    <p className="font-semibold">Our AI is analyzing the market...</p>
                    <p className="text-sm">This may take a few moments. Please wait.</p>
                </div>
            )}
            {!isSubmitting && !result && (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-4 border-2 border-dashed rounded-lg">
                    <Bot className="h-12 w-12"/>
                    <p className="font-semibold">Ready for your analysis</p>
                    <p className="text-sm">Fill out the form and click "Analyze Market" to begin.</p>
                </div>
            )}
            {result && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Estimated Monthly Rent</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      ${result.estimatedRent.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><BarChart className="h-5 w-5 text-accent"/>Market Trends</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.marketTrends}</p>
                </div>
                 <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Home className="h-5 w-5 text-accent"/>Comparable Properties</h3>
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
