import { LottieLoader } from '@/components/ui/LottieLoader';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.16))]">
      <LottieLoader message="Loading..." size={120} />
    </div>
  );
}