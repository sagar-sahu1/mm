
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuiz } from "@/contexts/QuizContext";
import { ResultDisplay } from "@/components/quiz/ResultDisplay";
import { Loader2, AlertTriangle, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


export default function ResultsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { activeQuiz, isLoadingQuiz, loadQuizFromStorage, clearActiveQuiz, allQuizzes } = useQuiz();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    if (quizId) {
      const loadedQuiz = loadQuizFromStorage(quizId);
      if (loadedQuiz && !loadedQuiz.completedAt) {
        // If quiz is found but not completed, redirect back to quiz page
        router.replace(`/quiz/${quizId}`);
      }
    }
    // Clean up active quiz when leaving results page unless it's the quiz we are viewing
    return () => {
      if (activeQuiz && activeQuiz.id !== quizId) {
         // clearActiveQuiz(); // May not be needed if activeQuiz is rehydrated correctly.
      }
    }
  }, [quizId, loadQuizFromStorage, activeQuiz, router]);


  if (!isClient || isLoadingQuiz) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading quiz results...</p>
      </div>
    );
  }
  
  // Use the activeQuiz from context if it matches, otherwise it should have been loaded by loadQuizFromStorage
  const quizToDisplay = (activeQuiz && activeQuiz.id === quizId && activeQuiz.completedAt) ? activeQuiz : allQuizzes.find(q => q.id === quizId && q.completedAt);
  // This line was problematic: const { allQuizzes } = useQuiz(); // Cannot call hooks conditionally or inside if.
  // Instead, rely on activeQuiz or ensure loadQuizFromStorage correctly sets it.

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

// Removed metadata export as it's not allowed in client components
// export const metadata = {
//   title: "Quiz Results",
//   description: "View your performance on the completed quiz.",
// };

