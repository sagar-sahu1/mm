"use client";
import { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function LottieLoader({
  message = "Loading...",
  size = 120,
  className = "",
}: {
  message?: string;
  size?: number;
  className?: string;
}) {
  const [lottieError, setLottieError] = useState(false);

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      {!lottieError ? (
        <DotLottieReact
          src="/KWrl55JmP8.lottie"
          loop
          autoplay
          style={{ width: size, height: size }}
          onError={() => setLottieError(true)}
        />
      ) : (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12 mb-2" />
          <span className="text-muted-foreground">{message}</span>
        </div>
      )}
      <span className="mt-4 text-lg text-muted-foreground">{message}</span>
    </div>
  );
} 