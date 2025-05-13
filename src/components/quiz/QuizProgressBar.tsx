
"use client";
import type { QuizQuestion } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuizProgressBarProps {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  onNavigate: (index: number) => void;
  isSubmittedView?: boolean;
}

export function QuizProgressBar({ questions, currentQuestionIndex, onNavigate, isSubmittedView = false }: QuizProgressBarProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg justify-center shadow">
        {questions.map((q, index) => {
          const isAttempted = q.userAnswer !== undefined && q.userAnswer !== '';
          const isActive = index === currentQuestionIndex;
          let bgColor = "bg-destructive hover:bg-destructive/80"; // Not attempted (red)
          let textColor = "text-destructive-foreground";

          if (isSubmittedView) {
            bgColor = q.isCorrect ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600";
            textColor = "text-white";
          } else if (isActive) {
            // Active question: using accent color (teal)
            bgColor = "bg-accent hover:bg-accent/90 ring-2 ring-accent-foreground ring-offset-2 ring-offset-background";
            textColor = "text-accent-foreground";
          } else if (isAttempted) {
            // Attempted but not active: using primary color (blue)
            bgColor = "bg-primary hover:bg-primary/90";
            textColor = "text-primary-foreground";
          }

          return (
            <Tooltip key={q.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavigate(index)}
                  aria-label={`Go to question ${index + 1}${isAttempted ? ', answered' : ', not answered'}${isActive ? ', current question' : ''}`}
                  className={`w-8 h-8 rounded-md flex items-center justify-center font-medium text-sm transition-all
                    ${bgColor} ${textColor}
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
                  `}
                >
                  {index + 1}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Question {index + 1}: {isAttempted ? "Answered" : "Not Answered"}
                  {isActive && !isSubmittedView && " (Current)"}
                  {isSubmittedView && (q.isCorrect ? " (Correct)" : " (Incorrect)")}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
