
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Link2Icon, Copy, Check, AlertTriangle } from 'lucide-react';
import { QUIZ_DIFFICULTY_LEVELS, DEFAULT_NUMBER_OF_QUESTIONS, MIN_QUESTIONS, MAX_QUESTIONS, type QuizDifficulty } from "@/lib/constants";
import { useToast } from '@/hooks/use-toast';
import { generateQuizQuestions, type GenerateQuizQuestionsInput, type QuizQuestion as GenAIQuizQuestion } from '@/ai/flows/generate-quiz-questions';
import { addChallenge } from '@/lib/firestoreUtils';
import type { QuizQuestion } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const challengeFormSchema = z.object({
  topic: z.string().min(2, "Topic must be at least 2 characters.").max(100, "Topic too long."),
  difficulty: z.enum(QUIZ_DIFFICULTY_LEVELS.map(level => level.value) as [QuizDifficulty, ...QuizDifficulty[]]),
  numberOfQuestions: z.number().min(MIN_QUESTIONS).max(MAX_QUESTIONS),
});

type ChallengeFormValues = z.infer<typeof challengeFormSchema>;

export default function ChallengePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && !currentUser) {
      router.push('/login?redirect=/challenge');
    }
  }, [isClient, authLoading, currentUser, router]);

  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues: {
      topic: "",
      difficulty: "medium",
      numberOfQuestions: DEFAULT_NUMBER_OF_QUESTIONS,
    },
  });

  const onSubmit = async (values: ChallengeFormValues) => {
    if (!currentUser) {
        toast({ title: "Authentication Required", description: "Please log in to create a challenge.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    setGeneratedLink(null);
    toast({
      title: "Generating Challenge Quiz...",
      description: "Hold tight, the AI is crafting the challenge!",
    });

    try {
      const aiInput: GenerateQuizQuestionsInput = {
        topic: values.topic,
        difficulty: values.difficulty,
        numberOfQuestions: values.numberOfQuestions,
      };
      const result = await generateQuizQuestions(aiInput);

      if (result.questions && result.questions.length > 0) {
        const slug = uuidv4().slice(0, 8); // Use a shorter UUID for the slug
        
        const challengeQuestions: QuizQuestion[] = result.questions.map((q: GenAIQuizQuestion) => ({
          id: uuidv4(), // Each question within the challenge gets a unique ID
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        }));
        
        await addChallenge({
          topic: values.topic,
          difficulty: values.difficulty,
          numberOfQuestions: values.numberOfQuestions,
          questions: challengeQuestions,
          challengerUid: currentUser.uid,
          challengerName: currentUser.displayName || currentUser.email || "A friend",
        }, slug);

        const link = `${window.location.origin}/challenge/${slug}`;
        setGeneratedLink(link);
        setCopied(false);
        toast({ title: "Challenge Ready!", description: "Share the link below with your friend." });
      } else {
        throw new Error("AI did not return any questions for the challenge.");
      }
    } catch (error) {
      console.error("Error generating challenge:", error);
      toast({
        title: "Uh oh! Something went wrong.",
        description: error instanceof Error ? error.message : "Could not generate challenge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
        .then(() => {
          setCopied(true);
          toast({ title: "Link Copied!", description: "Challenge link copied to clipboard." });
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          toast({ title: "Copy Failed", description: "Could not copy link. Please try manually.", variant: "destructive" });
        });
    }
  };

  if (!isClient || authLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p>Loading challenge page...</p>
      </div>
    );
  }
  
  if (!currentUser) {
     return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-20rem)] text-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base mb-6">
              You need to be logged in to create a challenge.
            </CardDescription>
            <Button asChild>
              <Link href="/login?redirect=/challenge">
                 Login to Create Challenge
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link2Icon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Challenge a Friend</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Generate a unique quiz and share the link with a friend to challenge them!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Quiz Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Solar System, Famous Paintings" {...field} className="text-base py-6"/>
                    </FormControl>
                    <FormDescription>
                      What subject will the challenge quiz be about?
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
                          defaultValue={[value ?? DEFAULT_NUMBER_OF_QUESTIONS]}
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
                  "Generate Challenge Link"
                )}
              </Button>
            </form>
          </Form>

          {generatedLink && (
            <div className="mt-8 p-4 border rounded-md bg-muted/50">
              <Label htmlFor="challenge-link" className="text-base font-semibold">Your Challenge Link:</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input id="challenge-link" type="text" value={generatedLink} readOnly className="text-sm bg-background" />
                <Button onClick={handleCopyLink} variant="outline" size="icon" aria-label="Copy link">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Share this link with your friend to start the challenge!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

