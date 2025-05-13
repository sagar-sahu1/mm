
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { generateQuizQuestions } from "@/ai/flows/generate-quiz-questions";
import type { GenerateQuizQuestionsInput } from "@/ai/flows/generate-quiz-questions";
import { QUIZ_DIFFICULTY_LEVELS, DEFAULT_NUMBER_OF_QUESTIONS, MIN_QUESTIONS, MAX_QUESTIONS, type QuizDifficulty } from "@/lib/constants";
import { useQuiz } from "@/contexts/QuizContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  topic: z.string().min(2, "Topic must be at least 2 characters.").max(100, "Topic too long."),
  difficulty: z.enum(QUIZ_DIFFICULTY_LEVELS.map(level => level.value) as [QuizDifficulty, ...QuizDifficulty[]]),
  numberOfQuestions: z.number().min(MIN_QUESTIONS).max(MAX_QUESTIONS),
});

type QuizFormValues = z.infer<typeof formSchema>;

export function QuizForm() {
  const { toast } = useToast();
  const { startQuiz } = useQuiz();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengerName, setChallengerName] = useState<string | null>(null);


  const form = useForm<QuizFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      difficulty: "medium",
      numberOfQuestions: DEFAULT_NUMBER_OF_QUESTIONS,
    },
  });

 useEffect(() => {
    // searchParams are available on initial render with App Router,
    // so router.isReady check is not typically needed as in Pages Router.
    const topicParam = searchParams.get("topic");
    const difficultyParam = searchParams.get("difficulty") as QuizDifficulty | null;
    const questionsParam = searchParams.get("questions");
    const challengerNameParam = searchParams.get("challengerName");

    if (topicParam) form.setValue("topic", topicParam);
    if (difficultyParam && QUIZ_DIFFICULTY_LEVELS.some(d => d.value === difficultyParam)) {
      form.setValue("difficulty", difficultyParam);
    }
    if (questionsParam) {
      const num = parseInt(questionsParam, 10);
      if (!isNaN(num) && num >= MIN_QUESTIONS && num <= MAX_QUESTIONS) {
        form.setValue("numberOfQuestions", num);
      }
    }
    if (challengerNameParam) {
      setChallengerName(challengerNameParam);
    }
  }, [searchParams, form]);


  async function onSubmit(values: QuizFormValues) {
    setIsSubmitting(true);
    toast({
      title: "Generating Quiz...",
      description: "Hold tight, your custom quiz is being crafted by AI!",
    });

    try {
      const aiInput: GenerateQuizQuestionsInput = {
        topic: values.topic,
        difficulty: values.difficulty,
        numberOfQuestions: values.numberOfQuestions,
      };
      const result = await generateQuizQuestions(aiInput);

      if (result.questions && result.questions.length > 0) {
        const quizId = startQuiz({
          topic: values.topic,
          difficulty: values.difficulty,
          questions: result.questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
          })),
          config: aiInput,
          challengerName: challengerName || undefined, // Pass challengerName if it exists
        });

        toast({
          title: "Quiz Ready!",
          description: `Your ${values.topic} quiz is generated. Good luck!`,
          variant: "default",
        });
        router.push(`/quiz/${quizId}`);
      } else {
        throw new Error("AI did not return any questions.");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      let errorMessage = "There was a problem generating your quiz. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message.includes("knownHelpersOnly") ? "There was an issue with the quiz generation service. Please try again shortly." : errorMessage;
      }
      toast({
        title: "Uh oh! Something went wrong.",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {challengerName && (
          <div className="p-3 bg-accent/10 border border-accent text-accent-foreground rounded-md text-center">
            You are taking a quiz challenged by <strong>{challengerName}</strong>!
          </div>
        )}
        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Quiz Topic</FormLabel>
              <FormControl>
                <Input placeholder="e.g., World History, JavaScript Fundamentals, Marine Biology" {...field} className="text-base py-6"/>
              </FormControl>
              <FormDescription>
                What subject do you want your quiz to be about?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg">Difficulty Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-base py-6">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {QUIZ_DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value} className="text-base">
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
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel className="text-lg">Number of Questions: {value}</FormLabel>
                <FormControl>
                  <Slider
                    min={MIN_QUESTIONS}
                    max={MAX_QUESTIONS}
                    step={1}
                    defaultValue={[value]}
                    onValueChange={(vals) => onChange(vals[0])}
                    className="py-3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" size="lg" className="w-full md:w-auto text-lg py-6 shadow-md" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Quiz"
          )}
        </Button>
      </form>
    </Form>
  );
}
