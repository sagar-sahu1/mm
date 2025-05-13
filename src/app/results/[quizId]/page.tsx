
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // useRouter removed as it's not used after changes
import { useQuiz } from "@/contexts/QuizContext";
import { ResultDisplay } from "@/components/quiz/ResultDisplay";
import { Loader2, AlertTriangle, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


export default function ResultsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { activeQuiz, isLoadingQuiz, loadQuizFromStorage, allQuizzes } = useQuiz(); // clearActiveQuiz removed, router removed
  const [isClient, setIsClient] = useState(false);
  // const router = useRouter(); // Removed, as direct navigation back to quiz isn't strictly needed here if completedAt is source of truth

  useEffect(() => {
    setIsClient(true);
    if (quizId) {
      const loadedQuiz = loadQuizFromStorage(quizId);
      // Optionally, if a quiz is loaded but NOT completed, you might redirect.
      // However, `ResultDisplay` will likely not render correctly anyway if `completedAt` is missing.
      // This check is more for ensuring `activeQuiz` is set if this page is directly navigated to.
      if (loadedQuiz && !loadedQuiz.completedAt) {
        // console.warn(`Quiz ${quizId} loaded on results page but not completed. Consider redirecting or handling.`);
        // router.replace(`/quiz/${quizId}`); // This line was previously here, could be reinstated if strict redirection is desired
      }
    }
  }, [quizId, loadQuizFromStorage]); // activeQuiz removed from dependencies as it might cause loops if it changes due to loadQuizFromStorage


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


