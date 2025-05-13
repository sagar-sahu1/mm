'use client';

import { useEffect, useState } from "react";
import { TimerIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface QuizTimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
  isPaused?: boolean;
  timerKey?: string | number; 
  compact?: boolean; 
}

export function QuizTimer({ duration, onTimeUp, isPaused = false, timerKey, compact = false }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration); 
  }, [duration, timerKey]);

  useEffect(() => {
    if (isPaused || timeLeft <= 0 || duration <= 0) {
      if (timeLeft <=0 && !isPaused && duration > 0) { 
         onTimeUp();
      }
      return;
    }
    
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeUp, isPaused, duration]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercentage = duration > 0 ? (timeLeft / duration) * 100 : 0;

  if (duration <=0 && !compact) { 
      // This case is handled by the QuizDisplay now to show "No time limit..."
      return null; 
  }
  if (duration <=0 && compact) {
      return null; 
  }


  if (compact) {
    return (
      <div className="flex items-center justify-end text-xs p-1 rounded bg-muted/50">
        <TimerIcon className="h-3 w-3 mr-1 text-primary" />
        <span className={`${timeLeft <= 10 && timeLeft > 0 && duration > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full p-3 border rounded-lg shadow-sm bg-card">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center text-xs text-muted-foreground">
          <TimerIcon className="h-4 w-4 mr-1.5 text-primary" />
          Time Left (Question)
        </div>
        <div className={`text-lg font-semibold ${timeLeft <= 10 && timeLeft > 0 && duration > 0 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
      <Progress value={progressPercentage} aria-label={`Time remaining for question: ${minutes} minutes ${seconds} seconds`} className="h-2" />
       {timeLeft <= 0 && duration > 0 && !isPaused && <p className="text-center text-destructive text-xs font-medium mt-1.5">Time's up for this question!</p>}
    </div>
  );
}
