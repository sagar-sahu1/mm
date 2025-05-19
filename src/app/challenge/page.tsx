"use client";

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Link2Icon, Copy, Check, AlertTriangle } from 'lucide-react';
import { QUIZ_DIFFICULTY_LEVELS, DEFAULT_NUMBER_OF_QUESTIONS, MIN_QUESTIONS, MAX_QUESTIONS, NUMBER_OF_QUESTIONS_OPTIONS, TIME_LIMIT_OPTIONS, type QuizDifficulty } from "@/lib/constants";
import { useToast } from '@/hooks/use-toast';
import { generateQuizQuestions, type GenerateQuizQuestionsInput } from '@/ai/flows/generate-quiz-questions';
import { addChallenge } from '@/lib/firestoreUtils';
import type { QuizQuestion } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

const challengeFormSchema = z.object({
  topic: z.string().min(2, "Topic must be at least 2 characters.").max(100, "Topic too long."),
  subtopic: z.string().max(100, "Subtopic too long.").optional(),
  difficulty: z.enum(QUIZ_DIFFICULTY_LEVELS.map(level => level.value) as [QuizDifficulty, ...QuizDifficulty[]]),
  numberOfQuestions: z.coerce.number().min(MIN_QUESTIONS).max(MAX_QUESTIONS),
  timeLimit: z.coerce.number().optional(),
  additionalInstructions: z.string().max(500, "Instructions too long.").optional(),
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
  const inputRef = useRef<HTMLInputElement>(null);

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
      subtopic: "",
      difficulty: "medium",
      numberOfQuestions: DEFAULT_NUMBER_OF_QUESTIONS,
      timeLimit: 15, // Default time limit, e.g., 15 minutes
      additionalInstructions: "",
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
        timeLimit: values.timeLimit,
      };
      if (values.subtopic && values.subtopic.trim() !== "") {
        aiInput.subtopic = values.subtopic;
      }
      if (values.additionalInstructions && values.additionalInstructions.trim() !== "") {
        aiInput.additionalInstructions = values.additionalInstructions;
      }
      const result = await generateQuizQuestions(aiInput);

      if (result.questions && result.questions.length > 0) {
        const slug = uuidv4().slice(0, 8); 
        
        const challengeQuestions: QuizQuestion[] = result.questions.map((q: any) => ({
          id: uuidv4(),
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        }));
        
        await addChallenge({
          topic: values.topic,
          difficulty: values.difficulty,
          numberOfQuestions: values.numberOfQuestions,
          timeLimit: values.timeLimit,
          questions: challengeQuestions,
          challengerUid: currentUser.uid,
          challengerName: currentUser.displayName || currentUser.email || "A friend",
          ...(values.subtopic && values.subtopic.trim() !== "" ? { subtopic: values.subtopic } : {}),
          ...(values.additionalInstructions && values.additionalInstructions.trim() !== "" ? { additionalInstructions: values.additionalInstructions } : {}),
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
      let description = error instanceof Error ? error.message : "Could not generate challenge. Please try again.";
      if (description.includes('503') || description.toLowerCase().includes('overloaded')) {
        description = "The AI model is currently overloaded. Please try again in a few minutes.";
      }
      toast({
        title: "Uh oh! Something went wrong.",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(generatedLink)
          .then(() => {
            setCopied(true);
            toast({ title: "Link Copied!", description: "Challenge link copied to clipboard." });
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => {
            if (inputRef.current) {
              inputRef.current.select();
              document.execCommand('copy');
              setCopied(true);
              toast({ title: "Link Copied!", description: "Challenge link copied to clipboard." });
              setTimeout(() => setCopied(false), 2000);
            } else {
              toast({ title: "Copy Failed", description: "Could not copy link. Please try manually.", variant: "destructive" });
            }
          });
      } else if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
        setCopied(true);
        toast({ title: "Link Copied!", description: "Challenge link copied to clipboard." });
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast({ title: "Copy Failed", description: "Could not copy link. Please try manually.", variant: "destructive" });
      }
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card className="shadow-xl border-2 border-primary/10 hover:border-primary/20 transition-all duration-300">
        <CardHeader className="text-center space-y-4 bg-gradient-to-b from-background to-muted/30 pb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Link2Icon className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Challenge a Friend
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground max-w-md mx-auto">
            Generate a unique quiz and share the link with a friend to challenge them!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-8">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-lg font-semibold">Quiz Topic</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Solar System, Famous Paintings" 
                          {...field} 
                          className="text-base py-6 bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-colors"
                        />
                      </FormControl>
                      <FormDescription className="text-muted-foreground/80">
                        What subject will the challenge quiz be about?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtopic"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-lg font-semibold">Specific Subtopic (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Planets, Renaissance Art" 
                          {...field} 
                          className="text-base py-6 bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-lg font-semibold">Difficulty Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-base py-6 bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-colors">
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
                    name="timeLimit"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-lg font-semibold">Time Limit (minutes)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="text-base py-6 bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-colors">
                              <SelectValue placeholder="Select time limit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIME_LIMIT_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()} className="text-base">
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
                  name="numberOfQuestions"
                  render={({ field: { value, onChange } }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-lg font-semibold">Number of Questions: {form.watch('numberOfQuestions')}</FormLabel>
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

                <FormField
                  control={form.control}
                  name="additionalInstructions"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-lg font-semibold">Additional Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any specific requirements for your quiz? E.g., 'Include code snippets', 'Focus on practical applications'"
                          className="resize-y min-h-[100px] text-base p-4 bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-colors"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button 
                type="submit" 
                size="lg" 
                className="w-full md:w-auto text-lg py-6 px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300" 
                disabled={isSubmitting}
              >
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
            <div className="mt-8 p-6 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
              <Label htmlFor="challenge-link" className="text-base font-semibold mb-3 block">Your Challenge Link:</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="challenge-link" 
                  type="text" 
                  value={generatedLink} 
                  readOnly 
                  className="text-sm bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-colors" 
                  ref={inputRef} 
                />
                <Button 
                  onClick={handleCopyLink} 
                  variant="outline" 
                  size="icon" 
                  className="border-primary/20 hover:border-primary/50 transition-colors"
                  aria-label="Copy link"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">Share this link with your friend to start the challenge!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
