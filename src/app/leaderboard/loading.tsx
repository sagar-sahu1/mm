"use client";
import { LottieLoader } from "@/components/ui/LottieLoader";
export default function Loading() {
  return <LottieLoader text="Loading Leaderboard..." />;
} 

import { LottieLoader } from '@/components/ui/LottieLoader';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <LottieLoader />
    </div>
  );
}
