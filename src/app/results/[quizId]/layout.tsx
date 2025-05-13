
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quiz Results - MindMash',
  description: 'View your performance on the completed quiz, review answers, and download your results.',
};

export default function QuizResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
