
"use client";

import { useEffect, useState } from "react";
import { TimerIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface QuizTimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
  isPaused?: boolean;
  timerKey?: string | number; // Add a key to reset the timer
  compact?: boolean; // For minimal display
}

export function QuizTimer({ duration, onTimeUp, isPaused = false, timerKey, compact = false }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration); 
  }, [duration, timerKey]); // timerKey will ensure reset when it changes (e.g. on question change)

  useEffect(() => {
    if (isPaused || timeLeft <= 0) {
      if (timeLeft <=0 && !isPaused && duration > 0) { 
         onTimeUp();
      }
      return;
    }
    
    if (duration <= 0) return; // Only run timer if duration is positive


    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeUp, isPaused, duration]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercentage = duration > 0 ? (timeLeft / duration) * 100 : 0;

  if (duration <=0 && !compact) { 
      return <div className="text-center text-muted-foreground p-4 border rounded-lg shadow bg-card">No time limit for this question.</div>;
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
    <div className="w-full p-4 border rounded-lg shadow bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <TimerIcon className="h-5 w-5 mr-2 text-primary" />
          Time Remaining (Question)
        </div>
        <div className={`text-xl font-bold ${timeLeft <= 10 && timeLeft > 0 && duration > 0 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
      <Progress value={progressPercentage} aria-label={`Time remaining for question: ${minutes} minutes ${seconds} seconds`} className="h-3" />
       {timeLeft <= 0 && duration > 0 && <p className="text-center text-destructive font-medium mt-2">Time's up for this question!</p>}
    </div>
  );
}

