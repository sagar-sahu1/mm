
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Take Quiz - MindMash',
  description: 'Engage in an interactive quiz on your chosen topic and test your knowledge.',
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
