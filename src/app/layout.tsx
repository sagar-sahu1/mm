
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["Quiz", "AI Quiz", "Education", "Learning", "MindMash"],
  authors: [{ name: "Firebase Studio", url: "https://firebase.google.com/studio/studio" }],
  creator: "Firebase Studio",
  // openGraph, twitter, icons metadata remains commented out for now
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
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
