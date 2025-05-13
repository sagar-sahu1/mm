
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Profile - MindMash',
  description: 'Manage your MindMash user profile, settings, and preferences.',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
