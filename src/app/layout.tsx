"use client";
// NOTE: If you need to define metadata for this layout, create a separate file named layout.metadata.ts in the same directory and export the metadata object from there.

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
import { Suspense, useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // Display loading for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${outfit.variable} antialiased flex flex-col min-h-screen`}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="mindmash-theme"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
              <DotLottieReact
                src="/KWrl55JmP8.lottie"
                loop
                autoplay
                style={{ width: '300px', height: '300px' }}
              />
              <p className="mt-4 text-lg font-semibold text-foreground">Loading MindMash...</p>
            </div>
          ) : (
            <Suspense fallback={null}>
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
            </Suspense>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
