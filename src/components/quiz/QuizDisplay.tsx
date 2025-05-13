
"use client";

import type { QuizQuestion } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useQuiz } from "@/contexts/QuizContext";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizDisplayProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string) => void;
  isSubmitted: boolean; // To show correct/incorrect answers after submission
}

export function QuizDisplay({ question, questionNumber, totalQuestions, onAnswer, isSubmitted }: QuizDisplayProps) {
  const [selectedValue, setSelectedValue] = useState<string | undefined>(question.userAnswer);
  const { activeQuiz } = useQuiz();

  useEffect(() => {
    setSelectedValue(question.userAnswer);
  }, [question.userAnswer]);

  const handleValueChange = (value: string) => {
    if (isSubmitted) return; // Don't allow changes after submission view
    setSelectedValue(value);
    onAnswer(value);
  };

  const getOptionStyle = (option: string) => {
    if (!isSubmitted && !activeQuiz?.completedAt) return ""; // No styling before submission
    if (option === question.correctAnswer) return "text-green-600 dark:text-green-400 font-semibold";
    if (option === question.userAnswer && option !== question.correctAnswer) return "text-red-600 dark:text-red-400 line-through";
    return "text-muted-foreground";
  };

  const getOptionIcon = (option: string) => {
    if (!isSubmitted && !activeQuiz?.completedAt) return null;
    if (option === question.correctAnswer) return <CheckCircle className="h-5 w-5 text-green-500 ml-2" />;
    if (option === question.userAnswer && option !== question.correctAnswer) return <XCircle className="h-5 w-5 text-red-500 ml-2" />;
    return null;
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardDescription className="text-base">
          Question {questionNumber} of {totalQuestions}
        </CardDescription>
        <CardTitle className="text-2xl leading-relaxed">{question.question}</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedValue}
          onValueChange={handleValueChange}
          className="space-y-3"
          disabled={isSubmitted || activeQuiz?.completedAt !== undefined}
        >
          {question.options.map((option, index) => (
            <Label
              key={index}
              htmlFor={`${question.id}-option-${index}`}
              className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors
                ${selectedValue === option && !isSubmitted ? 'ring-2 ring-primary border-primary' : ''}
                ${(isSubmitted || activeQuiz?.completedAt) && option === question.correctAnswer ? 'border-green-500 bg-green-500/10' : ''}
                ${(isSubmitted || activeQuiz?.completedAt) && option === question.userAnswer && option !== question.correctAnswer ? 'border-red-500 bg-red-500/10' : ''}
              `}
            >
              <RadioGroupItem value={option} id={`${question.id}-option-${index}`} />
              <span className={`text-base flex-grow ${getOptionStyle(option)}`}>{option}</span>
              {getOptionIcon(option)}
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
