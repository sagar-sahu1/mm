
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// Checkbox removed as it's no longer used
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateQuizQuestions } from "@/ai/flows/generate-quiz-questions";
import type { GenerateQuizQuestionsInput, QuizQuestion as GenAIQuizQuestion } from "@/ai/flows/generate-quiz-questions";
import { QUIZ_DIFFICULTY_LEVELS, NUMBER_OF_QUESTIONS_OPTIONS, TIME_LIMIT_OPTIONS, type QuizDifficulty } from "@/lib/constants";
import { useQuiz } from "@/contexts/QuizContext";
// useAuth removed as currentUser check for challenge link is removed.
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react"; // Link2Icon, Copy, Check removed
// addChallenge removed as this form no longer creates challenges
import type { QuizQuestion } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
  topic: z.string().min(2, "Topic must be at least 2 characters.").max(100, "Topic too long."),
  subtopic: z.string().max(100, "Subtopic too long.").optional(),
  difficulty: z.enum(QUIZ_DIFFICULTY_LEVELS.map(level => level.value) as [QuizDifficulty, ...QuizDifficulty[]]),
  numberOfQuestions: z.coerce.number().min(1).max(50),
  timeLimit: z.coerce.number().optional(),
  additionalInstructions: z.string().max(500, "Instructions too long.").optional(),
  // isPublic and generateChallengeLink removed from schema
});

type QuizFormValues = z.infer<typeof formSchema>;

export function QuizForm() {
  const { toast } = useToast();
  const { startQuiz } = useQuiz();
  // const { currentUser } = useAuth(); // No longer needed for this form's direct logic
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengerName, setChallengerName] = useState<string | null>(null);
  // generatedChallengeLink and copiedChallengeLink state removed

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      subtopic: "",
      difficulty: "medium",
      numberOfQuestions: 10,
      timeLimit: 15,
      additionalInstructions: "",
      // isPublic: false, // Removed
      // generateChallengeLink: false, // Removed
    },
  });

 useEffect(() => {
    const topicParam = searchParams.get("topic");
    const subtopicParam = searchParams.get("subtopic");
    const difficultyParam = searchParams.get("difficulty") as QuizDifficulty | null;
    const questionsParam = searchParams.get("questions");
    const timeLimitParam = searchParams.get("timeLimit");
    const challengerNameParam = searchParams.get("challengerName");

    if (topicParam) form.setValue("topic", topicParam);
    if (subtopicParam) form.setValue("subtopic", subtopicParam);
    if (difficultyParam && QUIZ_DIFFICULTY_LEVELS.some(d => d.value === difficultyParam)) {
      form.setValue("difficulty", difficultyParam);
    }
    if (questionsParam) {
      const num = parseInt(questionsParam, 10);
      if (!isNaN(num) && NUMBER_OF_QUESTIONS_OPTIONS.some(opt => opt.value === num)) {
        form.setValue("numberOfQuestions", num);
      }
    }
     if (timeLimitParam) {
      const num = parseInt(timeLimitParam, 10);
      if (!isNaN(num) && TIME_LIMIT_OPTIONS.some(opt => opt.value === num)) {
        form.setValue("timeLimit", num);
      }
    }
    if (challengerNameParam) {
      setChallengerName(challengerNameParam);
    }
  }, [searchParams, form]);


  async function onSubmit(values: QuizFormValues) {
    setIsSubmitting(true);
    // Removed challenge link state resets

    // Removed currentUser check related to generateChallengeLink, as that feature is moved to /challenge page
    
    toast({
      title: "Generating Quiz...", // Simplified toast
      description: "Hold tight, your custom quiz is being crafted by AI!",
    });

    try {
      const aiInput: GenerateQuizQuestionsInput = {
        topic: values.topic,
        subtopic: values.subtopic,
        difficulty: values.difficulty,
        numberOfQuestions: values.numberOfQuestions,
        timeLimit: values.timeLimit,
        additionalInstructions: values.additionalInstructions,
      };
      const result = await generateQuizQuestions(aiInput);

      if (!result.questions || result.questions.length === 0) {
        throw new Error("AI did not return any questions.");
      }
      
      const quizQuestions: QuizQuestion[] = result.questions.map((q: GenAIQuizQuestion) => ({
        id: uuidv4(),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      }));

      // Logic for generating a challenge link has been removed from this form.
      // This form now only generates quizzes for the current user to take immediately.
      // The /challenge page is responsible for creating shareable challenge links.
      
      const quizId = startQuiz({
        topic: values.topic,
        subtopic: values.subtopic,
        difficulty: values.difficulty,
        questions: quizQuestions, 
        config: aiInput, 
        challengerName: challengerName || undefined, // Kept for fulfilling challenges if navigated here with params
        timeLimit: values.timeLimit,
        additionalInstructions: values.additionalInstructions,
        // isPublic: values.isPublic, // isPublic removed from form values
        // For self-taken quizzes, isPublic will default to false or be omitted in startQuiz if not provided
      });

      toast({
        title: "Quiz Ready!",
        description: `Your ${values.topic} quiz is generated. Good luck!`,
      });
      router.push(`/quiz/${quizId}`);
      
    } catch (error) {
      console.error("Error during quiz generation:", error);
      toast({
        title: "Uh oh! Something went wrong.",
        description: error instanceof Error ? error.message : "Could not generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // handleCopyLink function removed as challenge link generation is removed from this form.


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {challengerName && (
          <div className="p-3 bg-accent/10 border border-accent text-accent-foreground rounded-md text-center">
            You are taking a quiz challenged by <strong>{challengerName}</strong>!
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-x-6 gap-y-8">
            <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Quiz Topic</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., JavaScript, World History, Science" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="subtopic"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Specific Subtopic (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., ES6 Features, Renaissance Period, Physics" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <div className="grid md:grid-cols-3 gap-x-6 gap-y-8">
            <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {QUIZ_DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                            {level.label}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
            control={form.control}
            name="numberOfQuestions"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Number of Questions</FormLabel>
                <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={String(field.value)}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select number of questions" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {NUMBER_OF_QUESTIONS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <FormField
            control={form.control}
            name="timeLimit"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Time Limit (minutes)</FormLabel>
                <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)} defaultValue={field.value !== undefined ? String(field.value) : undefined}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select time limit" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="0">No Time Limit</SelectItem>
                        {TIME_LIMIT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="additionalInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any specific requirements for your quiz? E.g., 'Include code snippets', 'Focus on practical applications'"
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Removed FormFields for isPublic and generateChallengeLink */}
        
        <Button type="submit" size="lg" className="w-full md:w-auto text-lg py-6 shadow-md" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            "Generate Quiz"
          )}
        </Button>
      </form>

      {/* Removed generatedChallengeLink display and copy UI */}
    </Form>
  );
}
