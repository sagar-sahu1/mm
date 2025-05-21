<<<<<<< HEAD
"use client";
import { LottieLoader } from "@/components/ui/LottieLoader";
export default function Loading() {
  return <LottieLoader text="Loading Contact..." />;
} 
=======
import { LottieLoader } from '@/components/ui/LottieLoader';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <LottieLoader message="Loading..." size={120} />
    </div>
  );
}
>>>>>>> 29de5215e62b746f53febc6e4475f8db1f9aa763
