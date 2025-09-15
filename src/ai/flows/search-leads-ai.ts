// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview Implements AI-powered search for leads by name, phone, or email using natural language queries.
 *
 * - searchLeadsWithAI - A function that searches leads using AI to understand natural language queries.
 * - SearchLeadsWithAIInput - The input type for the searchLeadsWithAI function.
 * - SearchLeadsWithAIOutput - The return type for the searchLeadsWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchLeadsWithAIInputSchema = z.object({
  searchQuery: z.string().describe('The natural language search query for leads.'),
});
export type SearchLeadsWithAIInput = z.infer<typeof SearchLeadsWithAIInputSchema>;

const SearchLeadsWithAIOutputSchema = z.object({
  processedQuery: z.string().describe('The processed and refined search query for database lookup.'),
});
export type SearchLeadsWithAIOutput = z.infer<typeof SearchLeadsWithAIOutputSchema>;

export async function searchLeadsWithAI(input: SearchLeadsWithAIInput): Promise<SearchLeadsWithAIOutput> {
  return searchLeadsWithAIFlow(input);
}

const searchLeadsPrompt = ai.definePrompt({
  name: 'searchLeadsPrompt',
  input: {schema: SearchLeadsWithAIInputSchema},
  output: {schema: SearchLeadsWithAIOutputSchema},
  prompt: `You are an AI assistant designed to refine user search queries for lead records.

  The user will provide a natural language search query, and your task is to process and refine this query into a format suitable for efficient database lookup.
  Focus on extracting key information such as name, phone number, and email from the query.
  If the query contains a name, extract it. If it contains a phone number, extract it and format it. If it contains an email, extract it and validate it.

  Consider these examples:

  - User Query: "Find John Doe's record."
    Processed Query: "John Doe"

  - User Query: "Search for the lead with the phone number 123-456-7890."
    Processed Query: "1234567890"

  - User Query: "I'm looking for a lead with the email address test@example.com."
    Processed Query: "test@example.com"

  - User Query: "Find lead named Robert or Bob"
    Processed Query: "Robert Bob"

  Now, process the following user query:
  {{{searchQuery}}}
  `,
});

const searchLeadsWithAIFlow = ai.defineFlow(
  {
    name: 'searchLeadsWithAIFlow',
    inputSchema: SearchLeadsWithAIInputSchema,
    outputSchema: SearchLeadsWithAIOutputSchema,
  },
  async input => {
    const {output} = await searchLeadsPrompt(input);
    return output!;
  }
);
