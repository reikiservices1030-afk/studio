// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview AI-powered rental market trend analyzer.
 *
 * - analyzeRentalMarket - A function that handles the rental market analysis process.
 * - AnalyzeRentalMarketInput - The input type for the analyzeRentalMarket function.
 * - AnalyzeRentalMarketOutput - The return type for the analyzeRentalMarket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeRentalMarketInputSchema = z.object({
  propertyType: z.string().describe('Type of property (e.g., apartment, house).'),
  location: z.string().describe('The location of the rental property.'),
  bedrooms: z.number().describe('Number of bedrooms in the property.'),
  bathrooms: z.number().describe('Number of bathrooms in the property.'),
  squareFootage: z.number().describe('Square footage of the property.'),
  amenities: z.string().describe('List of amenities the property offers.'),
});
export type AnalyzeRentalMarketInput = z.infer<typeof AnalyzeRentalMarketInputSchema>;

const AnalyzeRentalMarketOutputSchema = z.object({
  estimatedRent: z.number().describe('The estimated monthly rent for the property.'),
  marketTrends: z.string().describe('An analysis of current rental market trends in the area.'),
  comparableProperties: z.string().describe('A description of comparable properties in the area and their rental rates.'),
});
export type AnalyzeRentalMarketOutput = z.infer<typeof AnalyzeRentalMarketOutputSchema>;

export async function analyzeRentalMarket(input: AnalyzeRentalMarketInput): Promise<AnalyzeRentalMarketOutput> {
  return analyzeRentalMarketFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeRentalMarketPrompt',
  input: {schema: AnalyzeRentalMarketInputSchema},
  output: {schema: AnalyzeRentalMarketOutputSchema},
  prompt: `You are an expert real estate analyst specializing in rental market trends.

You will analyze the provided property details and provide an estimated monthly rent, an analysis of current rental market trends in the area, and a description of comparable properties and their rental rates.

Property Type: {{{propertyType}}}
Location: {{{location}}}
Bedrooms: {{{bedrooms}}}
Bathrooms: {{{bathrooms}}}
Square Footage: {{{squareFootage}}}
Amenities: {{{amenities}}}`,
});

const analyzeRentalMarketFlow = ai.defineFlow(
  {
    name: 'analyzeRentalMarketFlow',
    inputSchema: AnalyzeRentalMarketInputSchema,
    outputSchema: AnalyzeRentalMarketOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
