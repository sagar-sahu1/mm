
"use client";

import type { QuizQuestion } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { QuizTimer } from "./QuizTimer"; // For compact timer
import { DEFAULT_QUIZ_TIMER_SECONDS } from "@/lib/constants";


interface QuizDisplayProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string) => void;
  isSubmitted: boolean; 
  showFeedback: boolean; // New prop to control feedback visibility
  perQuestionTimeSeconds?: number; // For the compact timer
  onPerQuestionTimeUp?: () => void; // For the compact timer
}

export function QuizDisplay({ 
  question, 
  questionNumber, 
  totalQuestions, 
  onAnswer, 
  isSubmitted, 
  showFeedback,
  perQuestionTimeSeconds,
  onPerQuestionTimeUp
}: QuizDisplayProps) {
  const [selectedValue, setSelectedValue] = useState<string | undefined>(question.userAnswer);
  const { activeQuiz } = useQuiz(); 
  const { accessibility } = useTheme();
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);


  useEffect(() => {
    setSelectedValue(question.userAnswer);
    // Cancel any ongoing speech for the previous question
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null; 
    }
  }, [question.id, question.userAnswer]);

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis && window.speechSynthesis.speaking && utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
  }, []);


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

  const handleSpeak = () => {
    if (!accessibility.textToSpeech || !question.question) return;

    if (isSpeaking && utteranceRef.current) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
      return;
    }
    
    if (window.speechSynthesis) {
      // Cancel any previous speech before starting a new one
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(question.question);
      utteranceRef.current = utterance; // Store reference to the current utterance

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        // Only update state if this is the utterance that just ended
        if (utteranceRef.current === utterance) {
          setIsSpeaking(false);
          utteranceRef.current = null;
        }
      };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        if (utteranceRef.current === utterance) {
          setIsSpeaking(false);
          utteranceRef.current = null;
        }
        
        const errorCode = event.error || "unknown_error";
        // Log more detailed error information to the console for developers
        console.warn(
          `Speech synthesis error. Code: ${errorCode}. Utterance: "${event.utterance?.text?.substring(0,50)}..."`,
          "Full event:", event
        );
        
        let userMessage = "Could not play audio for the question.";
        // Check if event.error is a non-empty string before appending
        if (event.error && typeof event.error === 'string' && event.error.trim() !== "") {
            userMessage += ` Reason: ${event.error}. Please check browser permissions and TTS settings.`;
        } else if (event.error && typeof event.error === 'object' && 'message' in event.error && typeof event.error.message === 'string') {
            userMessage += ` Reason: ${event.error.message}. Please check browser permissions and TTS settings.`;
        } else if (event.error) { 
             userMessage += ` Error code: ${errorCode}. Please check browser permissions and TTS settings.`;
        } else {
            userMessage += " An unspecified Text-to-Speech error occurred.";
        }
        toast({ title: "Speech Error", description: userMessage, variant: "destructive" });
      };
      window.speechSynthesis.speak(utterance);
    } else {
      toast({ title: "TTS Not Supported", description: "Your browser does not support text-to-speech, or it might be disabled.", variant: "destructive" });
    }
  };


  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="relative">
        <div className="flex justify-between items-start"> {/* items-start to align title and icons block at the top */}
            <div className="flex-grow mr-2">
                {/* CardDescription for "Question X of Y" removed, handled by parent QuizPage */}
                <CardTitle className="text-2xl leading-relaxed">{question.question}</CardTitle>
            </div>
            <div className="flex flex-col items-end space-y-1 shrink-0"> {/* Container for TTS and compact timer */}
                {accessibility.textToSpeech && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleSpeak} aria-label={isSpeaking ? "Stop speaking" : "Speak question"} className="shrink-0">
                                    {isSpeaking ? <Loader2 className="h-5 w-5 animate-spin" /> : (question.question ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />) }
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                            <p>{isSpeaking ? "Stop speaking" : (question.question ? "Speak question" : "No question to speak")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                {/* Compact Timer */}
                {onPerQuestionTimeUp && perQuestionTimeSeconds !== undefined && perQuestionTimeSeconds > 0 && !activeQuiz?.completedAt && (
                  <div className="w-24"> {/* Adjust width as needed */}
                    <QuizTimer
                      timerKey={`compact-${question.id}`}
                      duration={perQuestionTimeSeconds}
                      onTimeUp={onPerQuestionTimeUp}
                      isPaused={isSubmitted || !!activeQuiz?.completedAt}
                      compact={true} // Add a compact prop to QuizTimer for minimal display
                    />
                  </div>
                )}
            </div>
        </div>
      </CardHeader>
      <CardContent>
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

