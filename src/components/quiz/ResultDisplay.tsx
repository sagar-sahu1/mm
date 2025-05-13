
"use client";

import type { Quiz } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, Download, RotateCcw, Share2, Home, Trophy, LayoutDashboard, ShieldAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { QuizDisplay } from "./QuizDisplay";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface ResultDisplayProps {
  quiz: Quiz;
}

export function ResultDisplay({ quiz }: ResultDisplayProps) {
  const { toast } = useToast();
  const scorePercentage = quiz.score !== undefined && quiz.questions.length > 0
    ? Math.round((quiz.score / quiz.questions.length) * 100)
    : 0;

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF();
      let yPosition = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 7; // Approximate line height

      // Add title
      doc.setFontSize(18);
      doc.text(`Quiz Results: ${quiz.topic}`, margin, yPosition);
      yPosition += lineHeight * 2;

      // Add subtopic and difficulty if available
      let details = `Difficulty: ${quiz.difficulty}`;
      if (quiz.subtopic) details += ` | Subtopic: ${quiz.subtopic}`;
      doc.setFontSize(12);
      doc.text(details, margin, yPosition);
      yPosition += lineHeight;

      if (quiz.challengerName) {
        doc.text(`Challenged by: ${quiz.challengerName}`, margin, yPosition);
        yPosition += lineHeight;
      }
      
      if (quiz.quizTerminationReason && quiz.quizTerminationReason !== "completed") {
        doc.setTextColor(255, 0, 0); // Red for termination reason
        let reasonText = "Quiz Terminated: ";
        if (quiz.quizTerminationReason === "cheating") reasonText += "Suspicious Activity";
        else if (quiz.quizTerminationReason === "time_up") reasonText += "Time Ran Out";
        else reasonText += quiz.quizTerminationReason;
        doc.text(reasonText, margin, yPosition);
        yPosition += lineHeight;
        doc.setTextColor(0, 0, 0); // Reset color
      }


      // Add score
      doc.setFontSize(14);
      doc.text(`Score: ${quiz.score}/${quiz.questions.length} (${scorePercentage}%)`, margin, yPosition);
      yPosition += lineHeight * 2;

      // Add questions and answers
      doc.setFontSize(12);
      quiz.questions.forEach((q, index) => {
        if (yPosition > pageHeight - margin * 2.5) { // Check for page break, ensure more space
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0); 
        
        const questionText = `Q${index + 1}: ${q.question}`;
        const questionLines = doc.splitTextToSize(questionText, doc.internal.pageSize.width - margin * 2);
        doc.text(questionLines, margin, yPosition);
        yPosition += questionLines.length * (lineHeight -1); // Slightly reduce line height for wrapped text

        const userAnswerText = `Your Answer: ${q.userAnswer || "Not Answered"}`;
         // User answer color: Red if wrong & answered, Gray if unanswered, Black if correct (implicitly handled by default)
        if (!q.isCorrect && q.userAnswer) {
            doc.setTextColor(220, 53, 69); // Destructive/Red
        } else if (!q.userAnswer) {
            doc.setTextColor(108, 117, 125); // Muted/Gray
        } else {
            doc.setTextColor(25, 135, 84); // Success/Green for correct user answer
        }
        const userAnswerLines = doc.splitTextToSize(userAnswerText, doc.internal.pageSize.width - margin * 2);
        doc.text(userAnswerLines, margin + 5, yPosition);
        yPosition += userAnswerLines.length * (lineHeight-1);


        if (!q.isCorrect) {
          doc.setTextColor(25, 135, 84); // Green for correct answer
          const correctAnswerText = `Correct Answer: ${q.correctAnswer}`;
          const correctAnswerLines = doc.splitTextToSize(correctAnswerText, doc.internal.pageSize.width - margin * 2);
          doc.text(correctAnswerLines, margin + 5, yPosition);
          yPosition += correctAnswerLines.length * (lineHeight-1);
        }
        
        doc.setTextColor(0,0,0); // Reset to black
        yPosition += lineHeight * 1.5; // Extra space between questions
      });

      doc.save(`MindMash_Quiz_Results_${quiz.topic.replace(/\s+/g, '_')}.pdf`);
      toast({
        title: "PDF Downloaded",
        description: "Your quiz results PDF has been generated.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: error instanceof Error ? error.message : "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareResults = () => {
    let shareText = `I scored ${scorePercentage}% on the ${quiz.topic} quiz on MindMash!`;
    if (quiz.quizTerminationReason === "cheating") {
      shareText = `My ${quiz.topic} quiz on MindMash was terminated due to suspicious activity.`;
    } else if (quiz.quizTerminationReason === "time_up") {
      shareText = `Time ran out on my ${quiz.topic} quiz on MindMash! Score: ${scorePercentage}%.`;
    } else if (quiz.challengerName) {
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
            Topic: <span className="font-semibold text-primary">{quiz.topic}</span>
            {quiz.subtopic && ` (${quiz.subtopic})`} | 
            Difficulty: <span className="font-semibold text-primary capitalize">{quiz.difficulty}</span>
          </CardDescription>
          {quiz.challengerName && (
            <p className="text-md text-muted-foreground mt-2 flex items-center justify-center">
              <Trophy className="h-5 w-5 mr-2 text-amber-500" />
              You were challenged by <strong>{quiz.challengerName}</strong>!
            </p>
          )}
           {quiz.quizTerminationReason && quiz.quizTerminationReason !== "completed" && (
            <div className={`mt-3 p-3 rounded-md text-lg font-semibold flex items-center justify-center gap-2
              ${quiz.quizTerminationReason === "cheating" ? "bg-destructive/10 text-destructive border border-destructive" : "bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-500"}`}>
              <ShieldAlert className="h-6 w-6" />
              Quiz Terminated: 
              {quiz.quizTerminationReason === "cheating" && " Suspicious Activity"}
              {quiz.quizTerminationReason === "time_up" && " Time Ran Out"}
            </div>
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
          
          <div className="flex flex-wrap gap-3 justify-center pt-4">
             <Button asChild size="lg">
              <Link href={`/create-quiz?topic=${encodeURIComponent(quiz.topic)}&difficulty=${quiz.difficulty}&questions=${quiz.questions.length}${quiz.subtopic ? `&subtopic=${encodeURIComponent(quiz.subtopic)}` : ''}${quiz.timeLimitMinutes ? `&timeLimit=${quiz.timeLimitMinutes}` : ''}${quiz.challengerName ? `&challengerName=${encodeURIComponent(quiz.challengerName)}` : ''}`}>
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
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-5 w-5" /> Dashboard
              </Link>
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
                      showFeedback={true} 
                      perQuestionDuration={0} // No timer in results view
                      onPerQuestionTimeUp={() => {}} // No action
                      timerKey={`result-q-${q.id}`}
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
