import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Banner() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20 py-12 md:py-16 lg:py-20">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/50 to-background/80 z-10" />
      <div className="container relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Banner Image - spans both columns on mobile, left on desktop */}
          <div className="relative w-full aspect-[16/9] lg:aspect-auto lg:h-[500px] rounded-2xl overflow-hidden col-span-1 lg:col-span-1">
            <Image
              src="/images/banner-main.png"
              alt="AI and Student Learning Banner"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Subtle gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          </div>
          {/* Right Column - Text and CTA */}
          <div className="relative flex flex-col justify-center space-y-6 lg:space-y-8 z-20">
            <div className="space-y-4 lg:space-y-6 bg-background/70 rounded-xl p-6 shadow-lg backdrop-blur-md">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Learn Smarter with{' '}
                <span className="gradient-text">AI-Powered</span> Quizzes
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                Instantly generated quizzes that adapt to your learning style. 
                Experience personalized education powered by artificial intelligence.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 transition-colors"
                asChild
              >
                <Link href="/quiz/generate">
                  Generate Your First Quiz
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6"
                asChild
              >
                <Link href="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 