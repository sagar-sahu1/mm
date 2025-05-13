
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuiz } from "@/contexts/QuizContext";
import { QuizDisplay } from "@/components/quiz/QuizDisplay";
import { QuizProgressBar } from "@/components/quiz/QuizProgressBar";
// Main QuizTimer component is now for the overall quiz timer if applicable.
// Per-question timer is compact and integrated into QuizDisplay or optionally shown separately.
// For this iteration, the primary visible timer will be per-question, driven by activeQuiz.perQuestionTimeSeconds
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckSquare, Loader2, AlertTriangle, Home, TimerIcon, HelpCircleIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { DEFAULT_QUIZ_TIMER_SECONDS } from "@/lib/constants";


export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const { activeQuiz, isLoadingQuiz, loadQuizFromStorage, answerQuestion, nextQuestion, previousQuestion, navigateToQuestion, submitQuiz } = useQuiz();
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

    if (overallTimeLeft === null) { 
       setOverallTimeLeft(activeQuiz.timeLimitMinutes * 60);
    }
    
    const intervalId = setInterval(() => {
      setOverallTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalId);
          if (activeQuiz && !activeQuiz.completedAt) { 
            submitQuiz();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);

  }, [activeQuiz, submitQuiz, overallTimeLeft]);


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
    if (typeof activeQuiz.timeLimitMinutes === 'number' && activeQuiz.timeLimitMinutes === 0) { 
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
    <div className="space-y-6 max-w-6xl mx-auto"> {/* Increased max-width for wider layout */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{activeQuiz.topic} Quiz</CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            Difficulty: <span className="capitalize font-semibold text-primary">{activeQuiz.difficulty}</span>
            {activeQuiz.subtopic && (<> | Subtopic: <span className="capitalize font-semibold text-primary">{activeQuiz.subtopic}</span></>)}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Green Box: Question Area */}
        <div className="lg:w-2/3 p-4 rounded-lg bg-green-500/10 border border-green-600/30 shadow-md">
          {currentQ && (
            <QuizDisplay
              question={currentQ}
              questionNumber={activeQuiz.currentQuestionIndex + 1}
              totalQuestions={activeQuiz.questions.length}
              onAnswer={handleAnswer}
              isSubmitted={!!activeQuiz.completedAt}
              showFeedback={false} // Feedback shown on results page
              perQuestionTimeSeconds={perQuestionDuration > 0 ? perQuestionDuration : undefined}
              onPerQuestionTimeUp={handlePerQuestionTimeUp}
            />
          )}
        </div>

        {/* Blue Box: Progress & Timer Area */}
        <div className="lg:w-1/3 p-4 rounded-lg bg-blue-500/10 border border-blue-600/30 shadow-md space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Quiz Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center text-muted-foreground"><HelpCircleIcon className="h-4 w-4 mr-2 text-primary" /> Question:</span>
                <span className="font-semibold text-foreground">{activeQuiz.currentQuestionIndex + 1} / {activeQuiz.questions.length}</span>
              </div>
              
              {(activeQuiz.timeLimitMinutes !== undefined && activeQuiz.timeLimitMinutes > 0 && overallTimeLeft !== null) && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground"><TimerIcon className="h-4 w-4 mr-2 text-primary" /> Overall Time:</span>
                  <span className={`font-semibold ${overallTimeLeft <= 60 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>{formatOverallTime(overallTimeLeft)}</span>
                </div>
              )}
              {activeQuiz.timeLimitMinutes === 0 && (
                 <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground"><TimerIcon className="h-4 w-4 mr-2 text-primary" /> Overall Time:</span>
                  <span className="font-semibold text-foreground">No Limit</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <QuizProgressBar
            questions={activeQuiz.questions}
            currentQuestionIndex={activeQuiz.currentQuestionIndex}
            onNavigate={navigateToQuestion}
            isSubmittedView={!!activeQuiz.completedAt}
          />
        </div>
      </div>

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

