"use client";
import { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LottieLoaderProps {
  text?: string;
  fullscreen?: boolean;
  size?: number;
}

export const LottieLoader = ({ text = 'Loading...', fullscreen = true, size = 180 }: LottieLoaderProps) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  if (!isClient) return null;
  return (
    <div className={`z-[9999] ${fullscreen ? 'fixed inset-0' : ''} flex flex-col items-center justify-center bg-background/90`}>
      <DotLottieReact
        src="/KWrl55JmP8.lottie"
        loop
        autoplay
        style={{ width: size, height: size }}
      />
      {text && <p className="mt-6 text-xl font-bold text-foreground text-center drop-shadow-lg">{text}</p>}
    </div>
  );
}; 