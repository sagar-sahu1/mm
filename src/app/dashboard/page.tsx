
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, UserCircle, ListChecks, Lightbulb, Link2, CalendarDays, BarChartHorizontalBig } from 'lucide-react';
import type { Quiz, QuizDifficulty } from '@/types';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { LoginStreakDisplay } from '@/components/dashboard/LoginStreakDisplay';
// QuizDifficultyPieChart import removed
import { getUniqueLoginDates, calculateUserLoginStreak, getWeeklyLoginStatus } from '@/lib/firestoreUtils';
import { QUIZ_DIFFICULTY_LEVELS } from '@/lib/constants';

export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { allQuizzes } = useQuiz();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const [loginStreak, setLoginStreak] = useState(0);
  const [weeklyStatus, setWeeklyStatus] = useState<boolean[]>(Array(7).fill(false));
  const [isStreakLoading, setIsStreakLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && !currentUser) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isClient, authLoading, currentUser, router]);

  useEffect(() => {
    if (currentUser && isClient) {
      setIsStreakLoading(true);
      getUniqueLoginDates(currentUser.uid)
        .then(uniqueDates => {
          const today = new Date();
          setLoginStreak(calculateUserLoginStreak(uniqueDates));
          setWeeklyStatus(getWeeklyLoginStatus(uniqueDates, today));
        })
        .catch(console.error)
        .finally(() => setIsStreakLoading(false));
    }
  }, [currentUser, isClient]);

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

  // difficultyDistribution logic removed as pie chart is removed

  return (
    <div className="max-w-6xl mx-auto space-y-8">
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
        <CardContent className="p-6 md:p-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Quizzes Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{totalQuizzesCompleted}</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{averageScore.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Topics Explored</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{uniqueTopicsExplored}</p>
            </CardContent>
          </Card>
           {isStreakLoading ? (
             <Card className="text-center shadow-md flex items-center justify-center min-h-[150px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </Card>
           ) : (
            <LoginStreakDisplay streak={loginStreak} weeklyStatus={weeklyStatus} />
           )}
        </CardContent>
      </Card>

      {/* Layout adjusted as PieChart is removed */}
      <Card className="shadow-xl h-full">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <CalendarDays className="mr-3 h-7 w-7 text-primary" />
            Your Login Activity
          </CardTitle>
          <CardDescription>
            Heatmap of your login activity over the past year.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {currentUser && <ActivityHeatmap userId={currentUser.uid} />}
        </CardContent>
      </Card>


      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="text-2xl font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardFooter className="p-6 md:p-8 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/create-quiz">
              <Lightbulb className="mr-2 h-5 w-5" /> Create New Quiz
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/history">
              <ListChecks className="mr-2 h-5 w-5" /> View Quiz History
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
            <Link href="/challenge">
              <Link2 className="mr-2 h-5 w-5" /> Challenge a Friend
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

