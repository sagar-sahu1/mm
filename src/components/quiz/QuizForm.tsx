
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, Link2Icon, Copy, Check } from "lucide-react";
import { addChallenge } from '@/lib/firestoreUtils';
import type { QuizQuestion } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
  topic: z.string().min(2, "Topic must be at least 2 characters.").max(100, "Topic too long."),
  subtopic: z.string().max(100, "Subtopic too long.").optional(),
  difficulty: z.enum(QUIZ_DIFFICULTY_LEVELS.map(level => level.value) as [QuizDifficulty, ...QuizDifficulty[]]),
  numberOfQuestions: z.coerce.number().min(1).max(50), // Max increased based on common request patterns
  timeLimit: z.coerce.number().optional(),
  additionalInstructions: z.string().max(500, "Instructions too long.").optional(),
  isPublic: z.boolean().default(false),
  generateChallengeLink: z.boolean().default(false),
});

type QuizFormValues = z.infer<typeof formSchema>;

export function QuizForm() {
  const { toast } = useToast();
  const { startQuiz } = useQuiz();
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengerName, setChallengerName] = useState<string | null>(null);
  const [generatedChallengeLink, setGeneratedChallengeLink] = useState<string | null>(null);
  const [copiedChallengeLink, setCopiedChallengeLink] = useState(false);

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      subtopic: "",
      difficulty: "medium",
      numberOfQuestions: 10,
      timeLimit: 15,
      additionalInstructions: "",
      isPublic: false,
      generateChallengeLink: false,
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
    setGeneratedChallengeLink(null);
    setCopiedChallengeLink(false);

    if (values.generateChallengeLink && !currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate a challenge link.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      router.push("/login?redirect=/create-quiz"); // or the current page with params
      return;
    }

    toast({
      title: values.generateChallengeLink ? "Generating Challenge..." : "Generating Quiz...",
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

      if (values.generateChallengeLink && currentUser) {
        const slug = uuidv4().slice(0, 8);
        await addChallenge({
          topic: values.topic,
          subtopic: values.subtopic,
          difficulty: values.difficulty,
          numberOfQuestions: values.numberOfQuestions,
          timeLimit: values.timeLimit,
          additionalInstructions: values.additionalInstructions,
          questions: quizQuestions,
          challengerUid: currentUser.uid,
          challengerName: currentUser.displayName || currentUser.email || "A friend",
          isPublic: values.isPublic,
        }, slug);
        const link = `${window.location.origin}/challenge/${slug}`;
        setGeneratedChallengeLink(link);
        toast({ title: "Challenge Ready!", description: "Share the link below with your friend." });

      } else {
        const quizId = startQuiz({
          topic: values.topic,
          subtopic: values.subtopic,
          difficulty: values.difficulty,
          questions: quizQuestions, // already enriched with IDs
          config: aiInput, // This is GenerateQuizQuestionsInput
          challengerName: challengerName || undefined,
          timeLimit: values.timeLimit,
          additionalInstructions: values.additionalInstructions,
          isPublic: values.isPublic,
        });

        toast({
          title: "Quiz Ready!",
          description: `Your ${values.topic} quiz is generated. Good luck!`,
        });
        router.push(`/quiz/${quizId}`);
      }
    } catch (error) {
      console.error("Error during quiz/challenge generation:", error);
      toast({
        title: "Uh oh! Something went wrong.",
        description: error instanceof Error ? error.message : "Could not complete generation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleCopyLink = () => {
    if (generatedChallengeLink) {
      navigator.clipboard.writeText(generatedChallengeLink)
        .then(() => {
          setCopiedChallengeLink(true);
          toast({ title: "Link Copied!", description: "Challenge link copied to clipboard." });
          setTimeout(() => setCopiedChallengeLink(false), 2000);
        })
        .catch(() => {
          toast({ title: "Copy Failed", description: "Could not copy link. Please try manually.", variant: "destructive" });
        });
    }
  };


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
                <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={String(field.value)}>
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

        <div className="space-y-4">
            <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                    <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                    <FormLabel>
                        Make this quiz public in the library
                    </FormLabel>
                    <FormDescription>
                        Allow other users to find and take this quiz.
                    </FormDescription>
                    </div>
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="generateChallengeLink"
                render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                    <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                    <FormLabel>
                        Generate a challenge link to share with others
                    </FormLabel>
                    <FormDescription>
                        Creates a unique link to challenge a friend with this quiz. Requires login.
                    </FormDescription>
                    </div>
                </FormItem>
                )}
            />
        </div>
        
        <Button type="submit" size="lg" className="w-full md:w-auto text-lg py-6 shadow-md" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {form.getValues("generateChallengeLink") ? "Generating Challenge..." : "Generating Quiz..."}
            </>
          ) : (
            form.getValues("generateChallengeLink") ? "Generate Challenge Link" : "Generate Quiz"
          )}
        </Button>
      </form>

      {generatedChallengeLink && (
        <div className="mt-8 p-4 border rounded-md bg-muted/50">
            <Label htmlFor="challenge-link" className="text-base font-semibold">Your Challenge Link:</Label>
            <div className="flex items-center gap-2 mt-2">
            <Input id="challenge-link" type="text" value={generatedChallengeLink} readOnly className="text-sm bg-background" />
            <Button onClick={handleCopyLink} variant="outline" size="icon" aria-label="Copy link">
                {copiedChallengeLink ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Share this link with your friend to start the challenge!</p>
        </div>
        )}
    </Form>
  );
}

