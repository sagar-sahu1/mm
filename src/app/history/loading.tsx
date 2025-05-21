"use client";
import { LottieLoader } from "@/components/ui/LottieLoader";
export default function Loading() {
  return <LottieLoader text="Loading History..." />;
} 

import { LottieLoader } from '@/components/ui/LottieLoader';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height)-var(--footer-height))]">
      <LottieLoader />
    </div>
  );
}

