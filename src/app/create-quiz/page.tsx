"use client";
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizForm } from "@/components/quiz/QuizForm";
import { Lightbulb } from "lucide-react";
import type { Metadata } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LottieLoader } from '@/components/ui/LottieLoader';

function CreateQuizPageContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Quiz Parameters</CardTitle>
          <CardDescription className="text-muted-foreground">
            Fill in the details below to generate your custom quiz.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <QuizForm />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateQuizPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/create-quiz');
    }
  }, [currentUser, loading, router]);
  if (loading || !currentUser) {
    return <LottieLoader message="Loading..." size={80} className="h-64" />;
  }
  return (
    <Suspense fallback={<LottieLoader message="Loading quiz options..." size={80} />}>
      <CreateQuizPageContent />
    </Suspense>
  );
}

