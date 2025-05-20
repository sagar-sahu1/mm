"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { getChallengeBySlug, type ChallengeData } from '@/lib/firestoreUtils';
import { AlertTriangle, Home, LogIn } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { LottieLoader } from '@/components/ui/LottieLoader';

export default function ChallengeSlugPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { startQuiz } = useQuiz();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !slug) return;

    async function loadChallenge() {
      setIsLoading(true);
      setError(null);

      try {
        const challengeData = await getChallengeBySlug(slug);

        if (!challengeData) {
          setError("Challenge not found or has expired.");
          setIsLoading(false);
          return;
        }

        if (!authLoading) { 
            if (!currentUser) {
                toast({
                    title: "Login Required",
                    description: "Please log in or sign up to take this challenge.",
                    variant: "default",
                    duration: 5000,
                });
                router.push(`/login?redirect=/challenge/${slug}`);
                return;
            }

            if (challengeData.challengerUid && currentUser.uid === challengeData.challengerUid) {
                setError("You cannot take your own challenge. Please share this link with a friend or log in with a different account.");
                setIsLoading(false);
                return;
            }

            const quizId = startQuiz({
                topic: challengeData.topic,
                subtopic: challengeData.subtopic,
                difficulty: challengeData.difficulty,
                questions: challengeData.questions.map(q => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                })),
                config: { 
                    topic: challengeData.topic,
                    subtopic: challengeData.subtopic,
                    difficulty: challengeData.difficulty,
                    numberOfQuestions: challengeData.numberOfQuestions,
                    timeLimit: challengeData.timeLimit,
                    additionalInstructions: challengeData.additionalInstructions,
                },
                challengerName: challengeData.challengerName,
                timeLimit: challengeData.timeLimit,
                additionalInstructions: challengeData.additionalInstructions,
                isPublic: challengeData.isPublic,
            });
            router.push(`/quiz/${quizId}`);
        }

      } catch (err) {
        console.error("Error loading challenge:", err);
        setError(err instanceof Error ? err.message : "Failed to load the challenge. Please try again.");
        setIsLoading(false);
      }
    }

    loadChallenge();

  }, [slug, authLoading, currentUser, router, startQuiz, toast, isClient]);

  if (isLoading || authLoading || !isClient) {
    return (
      <LottieLoader message="Loading challenge..." size={120} className="min-h-[calc(100vh-20rem)]" />
    );
  }

  if (error) {
    return (
      <Card className="max-w-lg mx-auto text-center shadow-lg">
        <CardHeader>
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle className="text-2xl">Challenge Error</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base mb-6">
            {error}
          </CardDescription>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" /> Go to Homepage
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)]">
      <LottieLoader message="Preparing your challenge quiz..." size={120} />
    </div>
  );
}
