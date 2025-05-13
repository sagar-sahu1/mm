
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - MindMash',
  description: 'Read the MindMash Privacy Policy to understand how we handle your data.',
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
