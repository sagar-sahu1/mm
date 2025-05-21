"use client";
import { LottieLoader } from "@/components/ui/LottieLoader";
export default function Loading() {
  return <LottieLoader text="Loading Dashboard..." />;
} 
import { LottieLoader } from '@/components/ui/LottieLoader';

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <LottieLoader />
    </div>
  );
}

