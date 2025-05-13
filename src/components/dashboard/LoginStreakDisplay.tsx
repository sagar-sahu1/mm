
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, CheckCircle2, CircleDot } from "lucide-react"; // Using CircleDot for "current day, not yet complete" or "logged in"

interface LoginStreakDisplayProps {
  streak: number;
  weeklyStatus: boolean[]; // 7 booleans for Mon, Tue, Wed, Thu, Fri, Sat, Sun
}

const dayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function LoginStreakDisplay({ streak, weeklyStatus }: LoginStreakDisplayProps) {
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday is 0, Sunday is 6

  return (
    <Card className="shadow-lg text-center bg-card h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex justify-center items-center mb-2">
          <Flame className="h-16 w-16 text-orange-500" />
        </div>
        <p className="text-5xl font-bold text-primary">{streak}</p>
        <CardTitle className="text-2xl font-semibold text-foreground">
          day streak!
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <div className="flex justify-around items-center my-3">
          {weeklyStatus.map((loggedIn, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground mb-1">{dayLabels[index]}</span>
              {loggedIn ? (
                <CheckCircle2 className={`h-6 w-6 ${index === todayIndex ? "text-orange-500" : "text-green-500"}`} />
              ) : (
                <CircleDot className={`h-6 w-6 ${index === todayIndex ? "text-muted-foreground/70 animate-pulse" : "text-muted-foreground/30" }`} />
              )}
            </div>
          ))}
        </div>
        <CardDescription className="text-sm text-muted-foreground mt-3">
          {streak > 0 ? "You're making great progress!" : "Log in daily to build your streak!"}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
