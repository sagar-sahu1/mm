
'use server';
/**
 * @fileOverview Generates quiz questions based on user-defined topics and difficulty.
 *
 * - generateQuizQuestions - A function that generates quiz questions.
 * - GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * - GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizQuestionsInputSchema = z.object({
  topic: z.string().describe('The main topic of the quiz.'),
  subtopic: z.string().optional().describe('A specific subtopic within the main topic. This is optional.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the quiz.'),
  numberOfQuestions: z.number().min(1).max(50).default(10).describe('The number of questions to generate. Defaults to 10.'),
  timeLimit: z.number().optional().describe('Optional: The suggested total time limit for the quiz in minutes. This is for informational purposes for question design.'),
  additionalInstructions: z.string().optional().describe('Optional: Any additional instructions for the quiz generation, like focusing on specific aspects or question types.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question.'),
  options: z.array(z.string()).length(4).describe('An array of 4 possible answers to the question.'),
  correctAnswer: z.string().describe('The correct answer to the question. This must be one of the strings provided in the "options" array.'),
});

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('The generated quiz questions.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: `You are a quiz generator.
Generate {{numberOfQuestions}} quiz questions about the topic: "{{topic}}"
{{#if subtopic}}
Focus specifically on the subtopic: "{{subtopic}}".
{{/if}}
The difficulty level should be {{difficulty}}.
{{#if timeLimit}}
The quiz is intended to be completed within approximately {{timeLimit}} minutes, so adjust question complexity accordingly.
{{/if}}
{{#if additionalInstructions}}
Please follow these additional instructions: "{{additionalInstructions}}".
{{/if}}
Each question must have exactly 4 multiple-choice options.
One of these options must be the correct answer.
Ensure the "correctAnswer" field for each question exactly matches one of the strings provided in its "options" array.
Provide the output in the specified JSON format.`,
});

const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

