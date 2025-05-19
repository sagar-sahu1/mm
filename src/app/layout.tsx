import type { Metadata } from 'next';
import { Outfit, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SettingsButton } from '@/components/layout/SettingsButton';
import { siteConfig } from '@/config/site';
import { QuizProvider } from '@/contexts/QuizContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ClientAnalyticsInitializer } from '@/components/layout/ClientAnalyticsInitializer';

// Configure Playfair Display as primary font
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-primary',
  display: 'swap',
  weight: ['400', '500', '700'],
});

// Configure Outfit as secondary font
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-secondary',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["Quiz", "AI Quiz", "Education", "Learning", "MindMash", "Challenge Quiz", "Interactive Quiz"],
  authors: [{ name: "Firebase Studio", url: "https://firebase.google.com/studio/studio" }],
  creator: "Firebase Studio",
  // openGraph, twitter, icons metadata remains commented out for now
  // For specific pages, metadata can be exported from the page.tsx file if it's a server component
  // or defined here if a pattern is needed, e.g., for /about or /contact if they were server components.
  // Example for specific pages (if they were server components):
  // '/about': {
  //   title: 'About MindMash',
  //   description: 'Learn more about MindMash, our mission, and how we use AI to create engaging quizzes.',
  // },
  // '/contact': {
  //   title: 'Contact Us - MindMash',
  //   description: 'Get in touch with the MindMash team.',
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${outfit.variable} antialiased flex flex-col min-h-screen`}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="mindmash-theme"
        >
          <AuthProvider>
            <QuizProvider>
              <ClientAnalyticsInitializer />
              <Header />
              <main className="flex-grow container py-8">
                {children}
              </main>
              <Footer />
              <SettingsButton />
              <Toaster />
            </QuizProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
