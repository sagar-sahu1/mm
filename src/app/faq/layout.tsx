
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - MindMash',
  description: 'Find answers to frequently asked questions about MindMash.',
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
