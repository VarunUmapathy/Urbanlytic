'use server';
/**
 * @fileOverview An AI flow to suggest incident details from an image.
 *
 * - suggestIncidentReport - A function that handles the suggestion process.
 * - SuggestIncidentReportInput - The input type for the function.
 * - SuggestIncidentReportOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestIncidentReportInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an incident, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestIncidentReportInput = z.infer<typeof SuggestIncidentReportInputSchema>;


const SuggestIncidentReportOutputSchema = z.object({
  type: z.enum(["traffic", "safety", "infrastructure", "pothole", "accident", "road_hazard", "public_disturbance"])
    .describe('The most likely category for the incident.'),
  description: z
    .string()
    .describe('A detailed, objective description of the incident based on the photo.'),
});
export type SuggestIncidentReportOutput = z.infer<typeof SuggestIncidentReportOutputSchema>;


export async function suggestIncidentReport(input: SuggestIncidentReportInput): Promise<SuggestIncidentReportOutput> {
  return suggestIncidentReportFlow(input);
}


const prompt = ai.definePrompt({
  name: 'suggestIncidentReportPrompt',
  input: {schema: SuggestIncidentReportInputSchema},
  output: {schema: SuggestIncidentReportOutputSchema},
  prompt: `You are an AI assistant for the Urban Pulse citizen reporting app. Your task is to analyze an image of an urban incident and provide a structured report.

Based on the user-provided image, identify the most appropriate incident category and write a concise, factual description of what you see.

- Analyze the image: {{media url=photoDataUri}}
- Determine the most relevant incident 'type'.
- Write a 'description' of the scene. Be objective and stick to what is visible in the image.

Your response must be in the specified JSON format.`,
});


const suggestIncidentReportFlow = ai.defineFlow(
  {
    name: 'suggestIncidentReportFlow',
    inputSchema: SuggestIncidentReportInputSchema,
    outputSchema: SuggestIncidentReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the model.');
    }
    return output;
  }
);
