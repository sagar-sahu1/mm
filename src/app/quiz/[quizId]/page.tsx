
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuiz } from "@/contexts/QuizContext";
import { QuizDisplay } from "@/components/quiz/QuizDisplay";
import { QuizProgressBar } from "@/components/quiz/QuizProgressBar";
// import { QuizTimer } from "@/components/quiz/QuizTimer"; // Basic timer added, can be enhanced
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckSquare, Loader2, AlertTriangle, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { DEFAULT_QUIZ_TIMER_SECONDS } from "@/lib/constants";


export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const { activeQuiz, isLoadingQuiz, loadQuizFromStorage, answerQuestion, nextQuestion, previousQuestion, submitQuiz, clearActiveQuiz } = useQuiz();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (quizId) {
      loadQuizFromStorage(quizId);
    }
    return () => {
      // Optional: Decide if active quiz should be cleared when navigating away before completion
      // clearActiveQuiz(); // This might be too aggressive if user just refreshes
    }
  }, [quizId, loadQuizFromStorage]);

  const handleAnswer = (answer: string) => {
    if (activeQuiz) {
      answerQuestion(activeQuiz.questions[activeQuiz.currentQuestionIndex].id, answer);
    }
  };

  const handleSubmitQuiz = () => {
    submitQuiz(); // Context now handles setting the completed quiz state
    // useEffect below will handle navigation once activeQuiz reflects completion
  };

  useEffect(() => {
    if (activeQuiz && activeQuiz.id === quizId && activeQuiz.completedAt) {
      router.push(`/results/${activeQuiz.id}`);
    }
  }, [activeQuiz, quizId, router]);


  const currentQ = activeQuiz?.questions[activeQuiz.currentQuestionIndex];

  if (!isClient || isLoadingQuiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading your quiz...</p>
      </div>
    );
  }

  if (!activeQuiz || activeQuiz.id !== quizId) {
    // This case handles if the quiz ID is not found or doesn't match active
    // It might also catch briefly while a quiz is loading if `isLoadingQuiz` isn't perfectly synced
    // or if `loadQuizFromStorage` fails to find a quiz.
    return (
      <Card className="max-w-lg mx-auto text-center shadow-lg">
        <CardHeader>
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle className="text-2xl">Quiz Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base mb-6">
            The quiz you are looking for could not be found, may not have loaded correctly, or the link might be incorrect.
            Try refreshing or starting a new quiz.
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
  
  // This check for redirection should ideally be handled by the useEffect above
  // if (activeQuiz.completedAt) {
  //    router.replace(`/results/${activeQuiz.id}`);
  //    return (
  //     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
  //       <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
  //       <p className="text-lg text-muted-foreground">Quiz completed. Redirecting to results...</p>
  //     </div>
  //   );
  // }


  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Card className="shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{activeQuiz.topic} Quiz</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Difficulty: <span className="capitalize font-semibold text-primary">{activeQuiz.difficulty}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Basic Timer Placeholder - can be enabled with QuizTimer component */}
      {/* {currentQ && (
        <QuizTimer
          key={currentQ.id} // Reset timer for each question
          duration={activeQuiz.timeLimitPerQuestion || DEFAULT_QUIZ_TIMER_SECONDS}
          onTimeUp={handleTimeUp}
          isPaused={false} // Add logic for pausing if needed
        />
      )} */}


      {currentQ && (
        <QuizDisplay
          question={currentQ}
          questionNumber={activeQuiz.currentQuestionIndex + 1}
          totalQuestions={activeQuiz.questions.length}
          onAnswer={handleAnswer}
          isSubmitted={false} // Not in submitted view during quiz taking
        />
      )}

      <QuizProgressBar
        questions={activeQuiz.questions}
        currentQuestionIndex={activeQuiz.currentQuestionIndex}
        onNavigate={(index) => {
          // For now, clicking progress bar won't navigate to avoid complex state sync issues without proper context methods.
          console.log("Navigate to question (visual only for now):", index + 1);
          // To implement navigation, a context function like `setCurrentQuestionIndex(index)` would be needed.
          // setActiveQuiz(prev => prev ? {...prev, currentQuestionIndex: index} : null); // This would update local state, but might conflict with context's next/prev
        }}
      />

      <div className="flex justify-between items-center pt-4">
        <Button
          onClick={previousQuestion}
          disabled={activeQuiz.currentQuestionIndex === 0}
          variant="outline"
          size="lg"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Previous
        </Button>

        {activeQuiz.currentQuestionIndex < activeQuiz.questions.length - 1 ? (
          <Button onClick={nextQuestion} size="lg">
            Next <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" size="lg" className="bg-green-600 hover:bg-green-700 text-white dark:text-primary-foreground">
                <CheckSquare className="mr-2 h-5 w-5" /> Submit Quiz
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ready to submit your answers?</AlertDialogTitle>
                <AlertDialogDescription>
                  Once submitted, you won't be able to change your answers.
                  Your results will be calculated.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Review Answers</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmitQuiz} className="bg-green-600 hover:bg-green-700 text-white dark:text-primary-foreground">
                  Yes, Submit Quiz
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

// Removed metadata export as it's not allowed in client components
// export const metadata = {
//   title: "Take Quiz",
//   description: "Engage in an interactive quiz on your chosen topic.",
// };
