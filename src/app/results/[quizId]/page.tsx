"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; 
import { useQuiz } from "@/contexts/QuizContext";
import { ResultDisplay } from "@/components/quiz/ResultDisplay";
import { AlertTriangle, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LottieLoader } from '@/components/ui/LottieLoader';


export default function ResultsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { activeQuiz, isLoadingQuiz, loadQuizFromStorage, allQuizzes } = useQuiz(); 
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []); 

  useEffect(() => {
    if (isClient && quizId) {
      loadQuizFromStorage(quizId);
    }
  }, [isClient, quizId, loadQuizFromStorage]);


  if (!isClient || isLoadingQuiz) {
    return (
      <LottieLoader message="Loading quiz results..." size={120} className="min-h-[calc(100vh-200px)]" />
    );
  }
  
  // Prioritize activeQuiz if it matches and is completed, otherwise search allQuizzes.
  // This ensures that if the user has just completed a quiz and is redirected here,
  // the activeQuiz (which has the freshest state including score, completedAt) is used.
  const quizToDisplay = (activeQuiz && activeQuiz.id === quizId && activeQuiz.completedAt) 
    ? activeQuiz 
    : allQuizzes.find(q => q.id === quizId && q.completedAt);

  if (!quizToDisplay) {
     return (
      <Card className="max-w-lg mx-auto text-center shadow-lg">
        <CardHeader>
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle className="text-2xl">Results Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base mb-6">
            The quiz results you are looking for could not be found.
            The quiz may not have been completed, or the link might be incorrect.
          </CardDescription>
          <Button asChild>
            <Link href="/create-quiz">
              <Home className="mr-2 h-4 w-4" /> Create a New Quiz
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <ResultDisplay quiz={quizToDisplay} />;
}