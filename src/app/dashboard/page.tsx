
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, UserCircle, BarChart3, ListChecks, Lightbulb, Link2 } from 'lucide-react';
import type { Quiz } from '@/types';

export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { allQuizzes } = useQuiz();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && !currentUser) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isClient, authLoading, currentUser, router]);

  if (!isClient || authLoading || !currentUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const completedQuizzes = allQuizzes.filter(quiz => quiz.completedAt);
  const totalQuizzesCompleted = completedQuizzes.length;
  
  const averageScore = totalQuizzesCompleted > 0
    ? completedQuizzes.reduce((acc, quiz) => {
        const scorePercentage = (quiz.score! / quiz.questions.length) * 100;
        return acc + scorePercentage;
      }, 0) / totalQuizzesCompleted
    : 0;

  const uniqueTopicsExplored = new Set(completedQuizzes.map(quiz => quiz.topic.toLowerCase())).size;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserCircle className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome, {currentUser.displayName || currentUser.email}!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Here's your MindMash activity overview.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 grid md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">Quizzes Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{totalQuizzesCompleted}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{averageScore.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">Topics Explored</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{uniqueTopicsExplored}</p>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="p-6 md:p-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/create-quiz">
              <Lightbulb className="mr-2 h-5 w-5" /> Create New Quiz
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/history">
              <ListChecks className="mr-2 h-5 w-5" /> View Quiz History
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/challenge">
              <Link2 className="mr-2 h-5 w-5" /> Challenge a Friend
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
