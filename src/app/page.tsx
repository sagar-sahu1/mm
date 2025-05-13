
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Lightbulb, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-12 py-8 md:py-16">
      <section className="space-y-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
          Welcome to <span className="text-primary">MindMash</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground">
          Unleash your curiosity! Generate engaging quizzes on any topic with the power of AI,
          challenge yourself, and track your learning journey.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg py-6 px-8 shadow-lg hover:shadow-primary/50 transition-shadow">
            <Link href="/create-quiz">
              <Lightbulb className="mr-2 h-5 w-5" /> Create Your First Quiz
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg py-6 px-8">
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </section>

      <section id="features" className="w-full max-w-5xl space-y-10 scroll-mt-20">
        <h2 className="text-3xl font-bold">Why MindMash?</h2>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Zap className="h-6 w-6 text-accent" />
                AI-Powered Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Instantly generate unique quizzes on any subject you can imagine.
                Perfect for students, teachers, and lifelong learners.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Image src="https://picsum.photos/40/40?random=1" alt="Interactive UI" width={24} height={24} className="rounded" data-ai-hint="abstract tech" />
                Interactive Interface
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Enjoy a smooth and engaging quiz-taking experience with clear navigation, timers, and progress tracking.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Track Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Review your results, understand your strengths and weaknesses, and see how you improve over time.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section className="w-full max-w-2xl">
         <Card className="bg-card shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Mash Some Knowledge?</CardTitle>
            <CardDescription>
              It's free to get started. Create a quiz now and see what you can learn!
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild size="lg" className="w-full text-lg py-6 shadow-lg hover:shadow-primary/50 transition-shadow">
              <Link href="/create-quiz">
                <Lightbulb className="mr-2 h-5 w-5" /> Let's Go!
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
