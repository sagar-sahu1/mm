"use client";
import { LottieLoader } from "@/components/ui/LottieLoader";
export default function Loading() {
  return <LottieLoader text="Loading Community..." />;
} 
import { LottieLoader } from '@/components/ui/LottieLoader';

export default function Loading() {
  return <LottieLoader className="flex items-center justify-center min-h-[calc(100vh-200px)]" />;
}

