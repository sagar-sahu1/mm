
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - MindMash',
  description: 'Get in touch with the MindMash team.',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
