
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuiz } from "@/contexts/QuizContext";
import { QuizDisplay } from "@/components/quiz/QuizDisplay";
import { QuizProgressBar } from "@/components/quiz/QuizProgressBar";
// Main QuizTimer component is now for the overall quiz timer if applicable.
// Per-question timer is compact and integrated into QuizDisplay or optionally shown separately.
// For this iteration, the primary visible timer will be per-question, driven by activeQuiz.perQuestionTimeSeconds
import { QuizTimer } from "@/components/quiz/QuizTimer"; 
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckSquare, Loader2, AlertTriangle, Home, TimerIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { DEFAULT_QUIZ_TIMER_SECONDS } from "@/lib/constants";


export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const { activeQuiz, isLoadingQuiz, loadQuizFromStorage, answerQuestion, nextQuestion, previousQuestion, navigateToQuestion, submitQuiz, setAllQuizzes } = useQuiz();
  const [isClient, setIsClient] = useState(false);
  const [overallTimeLeft, setOverallTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (quizId) {
      loadQuizFromStorage(quizId);
    }
  }, [quizId, loadQuizFromStorage]);


  // Initialize and manage overall quiz timer
  useEffect(() => {
    if (!activeQuiz || activeQuiz.completedAt || typeof activeQuiz.timeLimitMinutes !== 'number' || activeQuiz.timeLimitMinutes <= 0) {
      setOverallTimeLeft(null); // No overall timer or quiz completed/no limit
      return;
    }

    // Calculate initial overall time left. If quiz was reloaded, adjust based on createdAt.
    // This needs a reliable quiz start time. For simplicity, we'll just countdown from full duration.
    // A more robust solution would store quizAttemptStartTime when the user first opens the quiz.
    if (overallTimeLeft === null) { // Initialize only once or if activeQuiz changes
       setOverallTimeLeft(activeQuiz.timeLimitMinutes * 60);
    }
    
    const intervalId = setInterval(() => {
      setOverallTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalId);
          if (!activeQuiz.completedAt) { // Ensure not already submitted
            submitQuiz();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);

  }, [activeQuiz, submitQuiz]);


  const handleAnswer = (answer: string) => {
    if (activeQuiz && !activeQuiz.completedAt) {
      answerQuestion(activeQuiz.questions[activeQuiz.currentQuestionIndex].id, answer);
    }
  };

  const handleSubmitQuiz = () => {
    if (activeQuiz && !activeQuiz.completedAt) {
      submitQuiz();
    }
  };

  useEffect(() => {
    if (activeQuiz && activeQuiz.id === quizId && activeQuiz.completedAt) {
      router.push(`/results/${activeQuiz.id}`);
    }
  }, [activeQuiz, quizId, router]);


  const handlePerQuestionTimeUp = useCallback(() => {
    if (activeQuiz && !activeQuiz.completedAt) {
      if (activeQuiz.currentQuestionIndex < activeQuiz.questions.length - 1) {
        nextQuestion();
      } else {
        handleSubmitQuiz(); 
      }
    }
  }, [activeQuiz, nextQuestion, handleSubmitQuiz]);

  const currentQ = activeQuiz?.questions[activeQuiz.currentQuestionIndex];

  let perQuestionDuration = DEFAULT_QUIZ_TIMER_SECONDS;
  if (activeQuiz) {
    if (typeof activeQuiz.timeLimitMinutes === 'number' && activeQuiz.timeLimitMinutes === 0) { // "No Time Limit" for overall quiz
      // Use a very large number for per-question if we want to show "no limit" or a default for pacing
      // For now, let's stick to DEFAULT_QUIZ_TIMER_SECONDS for pacing if overall is no-limit.
      // Or, set to 0 to indicate no per-question timer for QuizTimer component.
      // Based on prompt "if not answered then it will proceed to next question", a per-question timer is always implied for pacing.
      perQuestionDuration = activeQuiz.perQuestionTimeSeconds || DEFAULT_QUIZ_TIMER_SECONDS;
    } else if (activeQuiz.perQuestionTimeSeconds && activeQuiz.perQuestionTimeSeconds > 0) {
      perQuestionDuration = activeQuiz.perQuestionTimeSeconds;
    }
  }


  if (!isClient || isLoadingQuiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading your quiz...</p>
      </div>
    );
  }

  if (!activeQuiz || activeQuiz.id !== quizId) {
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
  
  const formatOverallTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };


  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{activeQuiz.topic} Quiz</CardTitle>
          <div className="flex justify-center items-center gap-4 text-lg text-muted-foreground">
            <span>Difficulty: <span className="capitalize font-semibold text-primary">{activeQuiz.difficulty}</span></span>
            {activeQuiz.timeLimitMinutes !== undefined && activeQuiz.timeLimitMinutes > 0 && overallTimeLeft !== null && (
                <div className="flex items-center">
                    <TimerIcon className="h-5 w-5 mr-1 text-primary" />
                    <span>Total Left: {formatOverallTime(overallTimeLeft)}</span>
                </div>
            )}
             {activeQuiz.timeLimitMinutes === 0 && (
                 <div className="flex items-center">
                    <TimerIcon className="h-5 w-5 mr-1 text-primary" />
                    <span>No Overall Time Limit</span>
                </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Per-question timer is now integrated into QuizDisplay or can be this main QuizTimer if desired */}
      {/* For this iteration, QuizDisplay will have its own compact timer based on perQuestionDuration */}


      {currentQ && (
        <QuizDisplay
          question={currentQ}
          questionNumber={activeQuiz.currentQuestionIndex + 1}
          totalQuestions={activeQuiz.questions.length}
          onAnswer={handleAnswer}
          isSubmitted={!!activeQuiz.completedAt}
          showFeedback={false} // No feedback during the quiz
          perQuestionTimeSeconds={perQuestionDuration > 0 ? perQuestionDuration : undefined} // Pass duration for compact timer
          onPerQuestionTimeUp={handlePerQuestionTimeUp} // Handler for compact timer
        />
      )}

      <QuizProgressBar
        questions={activeQuiz.questions}
        currentQuestionIndex={activeQuiz.currentQuestionIndex}
        onNavigate={navigateToQuestion}
        isSubmittedView={!!activeQuiz.completedAt}
      />

      <div className="flex justify-between items-center pt-4">
        <Button
          onClick={previousQuestion}
          disabled={activeQuiz.currentQuestionIndex === 0 || !!activeQuiz.completedAt}
          variant="outline"
          size="lg"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Previous
        </Button>

        {activeQuiz.currentQuestionIndex < activeQuiz.questions.length - 1 ? (
          <Button onClick={nextQuestion} size="lg" disabled={!!activeQuiz.completedAt}>
            Next <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="default" 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white dark:text-primary-foreground"
                disabled={!!activeQuiz.completedAt}
              >
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
                <AlertDialogAction onClick={handleSubmitQuiz} className="bg-green-600 hover:bg-green-700">
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

