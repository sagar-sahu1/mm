
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
          let bgColor = "bg-secondary hover:bg-secondary/80"; // Not attempted
          let textColor = "text-secondary-foreground";

          if (isSubmittedView) {
            bgColor = q.isCorrect ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600";
            textColor = "text-white";
          } else if (isActive) {
            bgColor = "bg-primary hover:bg-primary/90 ring-2 ring-primary-foreground ring-offset-2 ring-offset-background";
            textColor = "text-primary-foreground";
          } else if (isAttempted) {
            bgColor = "bg-accent hover:bg-accent/90";
            textColor = "text-accent-foreground";
          }

          return (
            <Tooltip key={q.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavigate(index)}
                  aria-label={`Go to question ${index + 1}`}
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
