import { LottieLoader } from "@/components/ui/LottieLoader";

export default function Loading() {
  return (
      <LottieLoader message="Loading..." size={150} className="flex items-center justify-center min-h-screen"/>
  );
}