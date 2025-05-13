
"use client";

import type { Quiz } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, Download, RotateCcw, Share2, Home, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { QuizDisplay } from "./QuizDisplay";
import { useToast } from "@/hooks/use-toast";

interface ResultDisplayProps {
  quiz: Quiz;
}

export function ResultDisplay({ quiz }: ResultDisplayProps) {
  const { toast } = useToast();
  const scorePercentage = quiz.score !== undefined && quiz.questions.length > 0
    ? Math.round((quiz.score / quiz.questions.length) * 100)
    : 0;

  const handleDownloadPdf = () => {
    toast({
      title: "PDF Download (Coming Soon!)",
      description: "This feature is under development. Please check back later.",
    });
  };

  const handleShareResults = () => {
    let shareText = `I scored ${scorePercentage}% on the ${quiz.topic} quiz on MindMash!`;
    if (quiz.challengerName) {
      shareText = `I scored ${scorePercentage}% on a ${quiz.topic} quiz challenged by ${quiz.challengerName} on MindMash!`;
    }
    const shareUrl = `${window.location.origin}/results/${quiz.id}`;
    
    navigator.clipboard.writeText(`${shareText} Check out the results: ${shareUrl}`)
      .then(() => {
        toast({ title: "Link Copied!", description: "Results link copied to clipboard." });
      })
      .catch(() => {
        toast({ title: "Copy Failed", description: "Could not copy link. Please try manually.", variant: "destructive" });
      });
  };


  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Card className="shadow-xl text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold">Quiz Results</CardTitle>
          <CardDescription className="text-xl text-muted-foreground">
            Topic: <span className="font-semibold text-primary">{quiz.topic}</span> | Difficulty: <span className="font-semibold text-primary capitalize">{quiz.difficulty}</span>
          </CardDescription>
          {quiz.challengerName && (
            <p className="text-md text-muted-foreground mt-2 flex items-center justify-center">
              <Trophy className="h-5 w-5 mr-2 text-amber-500" />
              You were challenged by <strong>{quiz.challengerName}</strong>!
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-6xl font-bold text-primary">{scorePercentage}%</p>
            <p className="text-2xl text-muted-foreground">
              You answered {quiz.score} out of {quiz.questions.length} questions correctly.
            </p>
          </div>
          <Progress value={scorePercentage} aria-label={`Score: ${scorePercentage}%`} className="h-4 rounded-full" />
          
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button asChild size="lg">
              <Link href={`/create-quiz?topic=${encodeURIComponent(quiz.topic)}&difficulty=${quiz.difficulty}&questions=${quiz.questions.length}${quiz.challengerName ? `&challengerName=${encodeURIComponent(quiz.challengerName)}` : ''}`}>
                <RotateCcw className="mr-2 h-5 w-5" /> Try Again
              </Link>
            </Button>
             <Button onClick={handleShareResults} variant="outline" size="lg">
              <Share2 className="mr-2 h-5 w-5" /> Share Results
            </Button>
            <Button onClick={handleDownloadPdf} variant="outline" size="lg">
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" /> Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Review Your Answers</CardTitle>
          <CardDescription>See which questions you got right and wrong.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {quiz.questions.map((q, index) => (
              <AccordionItem value={`item-${index}`} key={q.id}>
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="flex-grow text-base md:text-lg">Question {index + 1}: {q.question.substring(0,50)}{q.question.length > 50 ? '...' : ''}</span>
                    {q.isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-green-500 ml-2 shrink-0" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500 ml-2 shrink-0" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-2 md:p-0">
                   <QuizDisplay
                      question={q}
                      questionNumber={index + 1}
                      totalQuestions={quiz.questions.length}
                      onAnswer={() => {}}
                      isSubmitted={true}
                    />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
