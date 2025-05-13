
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
          
          let bgColor = "";
          let textColor = "";
          let tooltipText = `Question ${index + 1}`;

          if (isSubmittedView) {
            if (q.isCorrect) {
              bgColor = "bg-green-500 hover:bg-green-600";
              textColor = "text-white";
              tooltipText += ": Correct";
            } else {
              bgColor = "bg-red-500 hover:bg-red-600";
              textColor = "text-white";
              tooltipText += ": Incorrect";
            }
          } else {
            if (isActive) {
              bgColor = "bg-accent hover:bg-accent/90 ring-2 ring-accent-foreground ring-offset-2 ring-offset-background";
              textColor = "text-accent-foreground";
              tooltipText += isAttempted ? ": Current, Answered" : ": Current, Not Answered";
            } else if (isAttempted) {
              bgColor = "bg-green-500 hover:bg-green-600"; // Answered questions are green
              textColor = "text-white";
              tooltipText += ": Answered";
            } else {
              bgColor = "bg-destructive hover:bg-destructive/80"; // Not attempted (red)
              textColor = "text-destructive-foreground";
              tooltipText += ": Not Answered";
            }
          }
          

          return (
            <Tooltip key={q.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavigate(index)}
                  aria-label={tooltipText}
                  className={`w-8 h-8 rounded-md flex items-center justify-center font-medium text-sm transition-all
                    ${bgColor} ${textColor}
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
                  `}
                >
                  {index + 1}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
