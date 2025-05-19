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
      description: "Experience the future of learning with our advanced AI quiz generation. Simply input any topic, and watch as our intelligent system crafts engaging, well-structured questions tailored to your needs. Perfect for students preparing for exams, teachers creating assessments, or anyone looking to test their knowledge in a fun, interactive way."
    },
    {
      icon: <Layout className="h-8 w-8 text-accent" />,
      title: "Interactive Interface",
      description: "Immerse yourself in our thoughtfully designed quiz-taking experience. Navigate through questions with ease, track your time with built-in timers, and monitor your progress in real-time. Our intuitive interface ensures you can focus on learning without any distractions, making your quiz experience both enjoyable and productive."
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      title: "Track Your Progress",
      description: "Take control of your learning journey with comprehensive progress tracking. Analyze your performance across different topics, identify areas for improvement, and celebrate your achievements. Our detailed analytics help you understand your strengths and weaknesses, enabling you to focus your efforts where they matter most."
    },
    {
      icon: <Volume2 className="h-8 w-8 text-accent" />,
      title: "Text to Speech",
      description: "Make learning accessible to everyone with our built-in text-to-speech functionality. Whether you're an auditory learner, have visual impairments, or simply prefer listening, our feature reads questions and answers aloud, ensuring an inclusive learning environment for all users."
    },
    {
      icon: <Shield className="h-8 w-8 text-accent" />,
      title: "Proctored Method",
      description: "Maintain academic integrity with our advanced anti-cheating measures. Our system monitors for suspicious behavior, prevents unauthorized access to answers, and ensures a fair playing field for all users. Take quizzes with confidence, knowing that your results reflect your true knowledge and understanding."
    },
    {
      icon: <Users className="h-8 w-8 text-accent" />,
      title: "Challenge a Friend",
      description: "Transform learning into a social experience with our 1v1 challenge feature. Compete with friends in real-time quiz battles, compare scores, and motivate each other to improve. Share your achievements on social media and build a community of learners who push each other to excel."
    },
    {
      icon: <Download className="h-8 w-8 text-accent" />,
      title: "Download Quiz Results",
      description: "Keep a record of your learning journey by downloading your quiz performance data as a PDF document. Easily save your results for review, share your achievements with others, or use the document for personal analysis."
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
                  className={getCardClass(index)}
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
