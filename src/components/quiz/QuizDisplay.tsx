'use client';

import type { QuizQuestion } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useRef } from "react";
import { useQuiz } from "@/contexts/QuizContext";
import { CheckCircle, XCircle, Volume2, Loader2, Info, VolumeX } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QuizTimer } from "./QuizTimer";

interface QuizDisplayProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string) => void;
  isSubmitted: boolean; 
  showFeedback: boolean; 
  perQuestionDuration: number; 
  onPerQuestionTimeUp: () => void;
  timerKey: string | number; 
  speakQuestion: () => void;
  isSpeaking: boolean;
  isTextToSpeechEnabled: boolean;
}

export function QuizDisplay({ 
  question, 
  onAnswer, 
  isSubmitted, 
  showFeedback,
  perQuestionDuration,
  onPerQuestionTimeUp,
  timerKey,
  speakQuestion,
  isSpeaking,
  isTextToSpeechEnabled,
}: QuizDisplayProps) {
  const [selectedValue, setSelectedValue] = useState<string | undefined>(question.userAnswer);
  const { activeQuiz } = useQuiz(); 
  const { accessibility } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    setSelectedValue(question.userAnswer);
  }, [question.id, question.userAnswer]);

  const handleValueChange = (value: string) => {
    if (isSubmitted || activeQuiz?.completedAt) return; 
    setSelectedValue(value);
    onAnswer(value);
  };

  const getOptionStyle = (option: string) => {
    if (!showFeedback) return ""; 
    if (option === question.correctAnswer) return "text-green-600 dark:text-green-400 font-semibold";
    if (option === question.userAnswer && option !== question.correctAnswer) return "text-red-600 dark:text-red-400 line-through";
    return "text-muted-foreground";
  };

  const getOptionIcon = (option: string) => {
    if (!showFeedback) return null;
    if (option === question.correctAnswer) return <CheckCircle className="h-5 w-5 text-green-500 ml-2" />;
    if (option === question.userAnswer && option !== question.correctAnswer) return <XCircle className="h-5 w-5 text-red-500 ml-2" />;
    return null;
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="relative pb-2">
        <div className="flex justify-between items-start">
            <div className="flex-grow mr-2">
                <CardTitle className="text-2xl leading-relaxed">{question.question}</CardTitle>
            </div>
            <div className="flex flex-col items-end space-y-1 shrink-0">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={speakQuestion}
                              aria-label={isSpeaking ? "Stop speaking" : (isTextToSpeechEnabled ? "Speak question" : "Text-to-speech disabled")}
                              className="shrink-0"
                            >
                                {isSpeaking ?
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    : isTextToSpeechEnabled ?
                                        <Volume2 className="h-5 w-5 text-primary" />
                                        : <VolumeX className="h-5 w-5 text-muted-foreground" />
                                }
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                        <p>{isSpeaking ? "Stop speaking" : (isTextToSpeechEnabled ? "Speak question" : "Text-to-speech disabled (Press F+J to enable)")}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
        {/* Per-question timer displayed below the question title and TTS icon area */}
        <div className="mt-3">
          {perQuestionDuration > 0 && !activeQuiz?.completedAt && !isSubmitted && (
            <QuizTimer
              timerKey={timerKey}
              duration={perQuestionDuration}
              onTimeUp={onPerQuestionTimeUp}
              isPaused={!!activeQuiz?.completedAt || isSubmitted}
              compact={false} // Use the non-compact version here for better visibility
            />
          )}
          {(perQuestionDuration <= 0 && !activeQuiz?.completedAt && !isSubmitted) && (
              <div className="text-center text-muted-foreground p-2 mt-1 border rounded-lg bg-muted/50 text-sm">No time limit for this question.</div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <RadioGroup
          value={selectedValue}
          onValueChange={handleValueChange}
          className="space-y-3"
          disabled={isSubmitted || !!activeQuiz?.completedAt}
        >
          {question.options.map((option, index) => (
            <Label
              key={index}
              htmlFor={`${question.id}-option-${index}`}
              className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors
                ${!isSubmitted && selectedValue === option ? 'ring-2 ring-primary border-primary bg-primary/5 cursor-pointer hover:bg-accent/10' : 'cursor-pointer hover:bg-accent/10'}
                ${showFeedback && option === question.correctAnswer ? 'border-green-500 bg-green-500/10' : ''}
                ${showFeedback && option === question.userAnswer && option !== question.correctAnswer ? 'border-red-500 bg-red-500/10' : ''}
                ${isSubmitted || activeQuiz?.completedAt ? 'cursor-default' : ''} 
              `}
            >
              <RadioGroupItem value={option} id={`${question.id}-option-${index}`} />
              <span className={`text-base flex-grow ${getOptionStyle(option)}`}>{option}</span>
              {getOptionIcon(option)}
            </Label>
          ))}
        </RadioGroup>
        {showFeedback && question.userAnswer !== question.correctAnswer && (
          <Card className="mt-4 border-blue-500 bg-blue-500/10">
            <CardContent className="p-4">
                <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mr-3 mt-1 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-blue-700">Correct Answer:</p>
                        <p className="text-sm text-blue-600">{question.correctAnswer}</p>
                    </div>
                </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
