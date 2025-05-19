'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Lightbulb, Zap, Layout, Volume2, Shield, Users, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-accent" />,
      title: "AI-Powered Quizzes",
      description: "Generate quizzes instantly on any topic. Our AI crafts questions tailored to your needs, making learning fast, fun, and effective for students, teachers, and lifelong learners alike."
    },
    {
      icon: <Layout className="h-8 w-8 text-accent" />,
      title: "Interactive Interface",
      description: "Enjoy a smooth quiz experience. Navigate questions easily, track your time, and see your progress in real time—all in a distraction-free, user-friendly interface."
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      title: "Track Your Progress",
      description: "Monitor your learning journey. Analyze your scores, spot strengths and weaknesses, and celebrate your achievements with detailed analytics and progress tracking."
    },
    {
      icon: <Volume2 className="h-8 w-8 text-accent" />,
      title: "Text to Speech",
      description: "Make quizzes accessible for everyone. Listen to questions and answers aloud—perfect for auditory learners or users with visual impairments."
    },
    {
      icon: <Shield className="h-8 w-8 text-accent" />,
      title: "Proctored Method",
      description: "Keep quizzes fair. Our anti-cheating features ensure your results reflect your true knowledge and effort."
    },
    {
      icon: <Users className="h-8 w-8 text-accent" />,
      title: "Challenge a Friend",
      description: "Compete with friends in real-time quiz battles. Share your scores and motivate each other to learn more."
    },
    {
      icon: <Download className="h-8 w-8 text-accent" />,
      title: "Download Quiz Results",
      description: "Save your quiz results as a PDF. Review your answers, track your progress, and share your achievements easily."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getCardClass = (index: number) => {
    const isCenter = index === activeIndex;
    const isLeft = index === (activeIndex - 1 + features.length) % features.length;
    const isRight = index === (activeIndex + 1) % features.length;

    if (isCenter) return "carousel-card center";
    if (isLeft) return "carousel-card left";
    if (isRight) return "carousel-card right";
    return "carousel-card hidden";
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-12 py-8 md:py-16 px-2 sm:px-4">
      <section className="space-y-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight break-words">
          Welcome to <span className="gradient-text">MindMash</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground">
          Unleash your curiosity! Generate engaging quizzes on any topic with the power of AI,
          challenge yourself, and track your learning journey.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
          <Button asChild size="lg" className="text-lg py-6 px-8 shadow-lg hover:shadow-primary/50 transition-shadow w-full sm:w-auto">
            <Link href="/create-quiz">
              <Lightbulb className="mr-2 h-5 w-5" /> Create Your First Quiz
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg py-6 px-8 w-full sm:w-auto">
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </section>

      <section id="features" className="w-full max-w-6xl space-y-10 scroll-mt-20 mb-24 px-0 sm:px-4">
        <h2 className="text-3xl font-bold">Why MindMash?</h2>
        <div className="perspective-2000">
          <div className="carousel-container">
            <div className="carousel-track">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className={getCardClass(index) + " p-4 md:p-6"}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl mb-4">
                      {feature.icon}
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      <section className="w-full max-w-2xl px-0 sm:px-4">
         <Card className="bg-card shadow-xl border border-purple-500">
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
