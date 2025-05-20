import { siteConfig } from '@/config/site';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Quiz", "AI Quiz", "Education", "Learning", "MindMash", "Challenge Quiz", "Interactive Quiz"
  ],
  authors: [{ name: "Firebase Studio", url: "https://firebase.google.com/studio/studio" }],
  creator: "Firebase Studio",
}; 