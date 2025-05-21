"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Lightbulb, ListChecks, Link2, UserCircle } from 'lucide-react';
import type { Quiz } from '@/types';
import { LoginStreakDisplay } from '@/components/dashboard/LoginStreakDisplay';
import { getUniqueLoginDates, calculateUserLoginStreak, getWeeklyLoginStatus } from '@/lib/firestoreUtils';
import { Input } from '@/components/ui/input';
import { LottieLoader } from '@/components/ui/LottieLoader';

export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { allQuizzes } = useQuiz();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const [loginStreak, setLoginStreak] = useState(0);
  const [weeklyStatus, setWeeklyStatus] = useState<boolean[]>(Array(7).fill(false));
  const [isStreakLoading, setIsStreakLoading] = useState(true);
  const [challengeInput, setChallengeInput] = useState("");

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

  const handleAcceptChallenge = () => {
    // Accepts either a full link or just the slug
    let slug = challengeInput.trim();
    if (slug.startsWith("http")) {
      try {
        const url = new URL(slug);
        const parts = url.pathname.split("/");
        slug = parts[parts.length - 1] || parts[parts.length - 2];
      } catch {
        // fallback: do nothing
      }
    }
    if (slug) {
      router.push(`/challenge/${slug}`);
    }
  };

  if (!isClient || authLoading || !currentUser) {
    return (
      <LottieLoader text="Loading dashboard..." />
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
                <LottieLoader size={40} text="" fullscreen={false} />
             </Card>
           ) : (
            <LoginStreakDisplay streak={loginStreak} weeklyStatus={weeklyStatus} />
           )}
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

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Accept a Challenge</CardTitle>
          <CardDescription>Paste a challenge link or code below to accept a quiz challenge from a friend.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-center">
          <Input
            type="text"
            placeholder="Paste challenge link or code here..."
            value={challengeInput}
            onChange={e => setChallengeInput(e.target.value)}
            className="w-full md:w-2/3"
          />
          <Button
            onClick={handleAcceptChallenge}
            size="lg"
            className="w-full md:w-auto"
            disabled={!challengeInput.trim()}
          >
            Accept
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

