'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAnswerExplanationInputSchema = z.object({
  question: z.string().describe('The quiz question.'),
  correctAnswer: z.string().describe('The correct answer.'),
  userAnswer: z.string().optional().describe('The answer provided by the user, if any.'),
});
export type GenerateAnswerExplanationInput = z.infer<typeof GenerateAnswerExplanationInputSchema>;

const GenerateAnswerExplanationOutputSchema = z.object({
  explanation: z.string().describe('A short explanation of why the answer is correct or incorrect.'),
});
export type GenerateAnswerExplanationOutput = z.infer<typeof GenerateAnswerExplanationOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateAnswerExplanationPrompt',
  input: { schema: GenerateAnswerExplanationInputSchema },
  output: { schema: GenerateAnswerExplanationOutputSchema },
  prompt: `You are an expert quiz explainer. For the following question, provide a short, clear explanation (2-3 sentences) of why the correct answer is correct. If the user answer is incorrect, explain why it is incorrect and what the correct answer is.\n\nQuestion: {{question}}\nCorrect Answer: {{correctAnswer}}\nUser Answer: {{userAnswer}}\n\nExplanation:`
});

export async function generateAnswerExplanation(input: GenerateAnswerExplanationInput): Promise<GenerateAnswerExplanationOutput> {
  const { output } = await prompt(input);
  return output!;
} 