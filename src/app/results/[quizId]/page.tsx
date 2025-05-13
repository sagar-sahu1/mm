"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; 
import { useQuiz } from "@/contexts/QuizContext";
import { ResultDisplay } from "@/components/quiz/ResultDisplay";
import { Loader2, AlertTriangle, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


export default function ResultsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { activeQuiz, isLoadingQuiz, loadQuizFromStorage, allQuizzes } = useQuiz(); 
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (quizId) {
      // Call loadQuizFromStorage to ensure activeQuiz is set if the user navigates directly.
      // The function reference `loadQuizFromStorage` comes from the useQuiz context.
      // By not including `loadQuizFromStorage` or `allQuizzes` in the dependency array here,
      // we prevent the effect from re-running if `loadQuizFromStorage`'s identity changes
      // due to `allQuizzes` updating (which can happen if `loadQuizFromStorage` itself
      // modifies `allQuizzes`, e.g., by setting `startedAt`).
      // This effect should primarily react to `quizId` changing.
      loadQuizFromStorage(quizId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]); 


  if (!isClient || isLoadingQuiz) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading quiz results...</p>
      </div>
    );
  }
  
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
