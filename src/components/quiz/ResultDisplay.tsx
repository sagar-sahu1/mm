"use client";

import type { Quiz } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, Download, RotateCcw, Share2, Home, Trophy, LayoutDashboard, ShieldAlert, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { QuizDisplay } from "./QuizDisplay";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { generateAnswerExplanation } from '@/ai/flows/generate-answer-explanation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, getCheatingFlagsForQuiz } from '@/lib/firestoreUtils';
import type { UserProfileFirestoreData, CheatingActivityLog } from '@/types';
import { format } from 'date-fns';

interface ResultDisplayProps {
  quiz: Quiz;
}

// Add a list of motivational Gita quotes
const GITA_QUOTES = [
  "You have the right to work, but never to the fruit of work. - Bhagavad Gita 2.47",
  "Change is the law of the universe. You can be a millionaire, or a pauper in an instant. - Bhagavad Gita 15.15",
  "There is neither this world, nor the world beyond. Happiness comes only to those who dedicate themselves to a cause. - Bhagavad Gita 2.70",
  "A person can rise through the efforts of his own mind; or draw himself down, in the same manner. Because each person is his own friend or enemy. - Bhagavad Gita 6.5",
  "Set your heart upon your work but never its reward. - Bhagavad Gita 2.47",
  "No one who does good work will ever come to a bad end, either here or in the world to come. - Bhagavad Gita 6.40",
  "Man is made by his belief. As he believes, so he is. - Bhagavad Gita 17.3",
];

export function ResultDisplay({ quiz }: ResultDisplayProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const scorePercentage = quiz.score !== undefined && quiz.questions.length > 0
    ? Math.round((quiz.score / quiz.questions.length) * 100)
    : 0;

  const [explanations, setExplanations] = useState<string[]>([]);
  const [loadingExplanations, setLoadingExplanations] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileFirestoreData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [cheatingLogs, setCheatingLogs] = useState<CheatingActivityLog[] | null>(null);
  const [loadingCheatingLogs, setLoadingCheatingLogs] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      if (currentUser?.uid) {
        setLoadingProfile(true);
        const profile = await getUserProfile(currentUser.uid);
        if (isMounted) setUserProfile(profile);
        setLoadingProfile(false);
      } else {
        setUserProfile(null);
        setLoadingProfile(false);
      }
    }
    fetchProfile();
    return () => { isMounted = false; };
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;
    async function fetchExplanations() {
      setLoadingExplanations(true);
      const results: string[] = [];
      for (const q of quiz.questions) {
        try {
          const res = await generateAnswerExplanation({
            question: q.question,
            correctAnswer: q.correctAnswer,
            userAnswer: q.userAnswer || '',
          });
          results.push(res.explanation);
        } catch {
          results.push('Explanation not available.');
        }
      }
      if (isMounted) setExplanations(results);
      setLoadingExplanations(false);
    }
    fetchExplanations();
    return () => { isMounted = false; };
  }, [quiz.questions]);

  // Fetch cheating logs
  useEffect(() => {
    let isMounted = true;
    async function fetchLogs() {
      if (currentUser?.uid && quiz.id) {
        setLoadingCheatingLogs(true);
        try {
          const logs = await getCheatingFlagsForQuiz(quiz.id, currentUser.uid);
          if (isMounted) setCheatingLogs(logs);
        } catch {
          if (isMounted) setCheatingLogs([]);
        }
        setLoadingCheatingLogs(false);
      } else {
        setCheatingLogs([]);
        setLoadingCheatingLogs(false);
      }
    }
    fetchLogs();
    return () => { isMounted = false; };
  }, [currentUser, quiz.id]);

  const handleDownloadPdf = async () => {
    if (loadingExplanations || explanations.some(e => !e) || loadingProfile || loadingCheatingLogs) {
      toast({
        title: 'Your result is generating, please wait...',
        description: 'We are preparing your PDF with all answer explanations, your profile, and activity logs.',
      });
      setIsGeneratingPdf(true);
      await new Promise(resolve => setTimeout(resolve, 5000));
      setIsGeneratingPdf(false);
    }
    try {
      const doc = new jsPDF();
      const margin = 20;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const lineHeight = 7;
      let yPosition = margin + 10;

      // User info (left) and quiz info (right) at the top
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 128);
      let userInfoLines = [];
      if (userProfile) {
        if (userProfile.displayName) userInfoLines.push(`Name: ${userProfile.displayName}`);
        if (userProfile.email) userInfoLines.push(`Email: ${userProfile.email}`);
        if (currentUser?.uid) userInfoLines.push(`User ID: ${currentUser.uid}`);
        if (userProfile.bio) userInfoLines.push(`Bio: ${userProfile.bio}`);
      } else {
        userInfoLines.push('User profile not available.');
      }
      let quizInfoLines = [
        `Topic: ${quiz.topic}`,
        `Difficulty: ${quiz.difficulty}`,
        `Score: ${quiz.score}/${quiz.questions.length} (${scorePercentage}%)`
      ];
      if (quiz.subtopic) quizInfoLines.push(`Subtopic: ${quiz.subtopic}`);
      if (quiz.timeLimitMinutes) quizInfoLines.push(`Time Limit: ${quiz.timeLimitMinutes} min`);
      if (quiz.challengerName) quizInfoLines.push(`Challenged by: ${quiz.challengerName}`);
      if (quiz.additionalInstructions) quizInfoLines.push(`Instructions: ${quiz.additionalInstructions}`);

      // Draw user info (left)
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 128);
      doc.text(userInfoLines, margin, yPosition);
      // Draw quiz info (right)
      doc.setFontSize(12);
      doc.setTextColor(0, 128, 0);
      doc.text(quizInfoLines, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += Math.max(userInfoLines.length, quizInfoLines.length) * lineHeight + 10;
      doc.setTextColor(0, 0, 0);

      // Centered Quiz Title
      doc.setFontSize(18);
      doc.text(`Quiz Results`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 2;

      // Questions and answers (centered block)
      doc.setFontSize(12);
      quiz.questions.forEach((q, index) => {
        if (yPosition > pageHeight - margin * 3) {
          doc.addPage();
          yPosition = margin + 10;
        }
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const questionText = `Q${index + 1}: ${q.question}`;
        const questionLines = doc.splitTextToSize(questionText, pageWidth - margin * 2);
        doc.text(questionLines, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += questionLines.length * (lineHeight - 1);

        // Show answer status
        let status = '';
        if (!q.userAnswer) {
          status = 'Skipped';
          doc.setTextColor(108, 117, 125);
        } else if (q.isCorrect) {
          status = 'Correct';
          doc.setTextColor(25, 135, 84);
        } else {
          status = 'Incorrect';
          doc.setTextColor(220, 53, 69);
        }
        doc.text(`Status: ${status}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += lineHeight;

        // Show user answer
        const userAnswerText = `Your Answer: ${q.userAnswer || 'Not Answered'}`;
        const userAnswerLines = doc.splitTextToSize(userAnswerText, pageWidth - margin * 2);
        doc.text(userAnswerLines, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += userAnswerLines.length * (lineHeight - 1);

        // Show correct answer if incorrect or skipped
        if (!q.isCorrect || !q.userAnswer) {
          doc.setTextColor(25, 135, 84);
          const correctAnswerText = `Correct Answer: ${q.correctAnswer}`;
          const correctAnswerLines = doc.splitTextToSize(correctAnswerText, pageWidth - margin * 2);
          doc.text(correctAnswerLines, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += correctAnswerLines.length * (lineHeight - 1);
        }

        // Show explanation (always)
        doc.setTextColor(0, 0, 0);
        const explanation = explanations[index] || 'Explanation not available.';
        const explanationLines = doc.splitTextToSize('Explanation: ' + explanation, pageWidth - margin * 2);
        doc.text(explanationLines, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += explanationLines.length * (lineHeight - 1);

        yPosition += lineHeight * 1.5;
      });

      // Suspicious Activity Log (at end)
      if (yPosition > pageHeight - margin * 4) {
        doc.addPage();
        yPosition = margin + 10;
      }
      doc.setFontSize(12);
      doc.setTextColor(220, 53, 69);
      doc.text('Suspicious Activity Log:', margin, yPosition);
      yPosition += lineHeight;
      doc.setTextColor(0, 0, 0);
      if (!cheatingLogs || cheatingLogs.length === 0) {
        doc.text('N.A.', margin + 5, yPosition);
        yPosition += lineHeight;
      } else {
        cheatingLogs.forEach((log, idx) => {
          const logTime = log.timestamp && typeof log.timestamp.toDate === 'function' ? format(log.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss') : '';
          const logText = `${idx + 1}. [${log.activityType}] ${log.details || ''} ${logTime ? `at ${logTime}` : ''}`;
          const logLines = doc.splitTextToSize(logText, pageWidth - margin * 2 - 5);
          doc.text(logLines, margin + 5, yPosition);
          yPosition += logLines.length * (lineHeight - 1);
        });
      }

      // Date/time in far lower right corner
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      let quizDate = quiz.completedAt ? new Date(quiz.completedAt) : new Date();
      const dateStr = format(quizDate, 'yyyy-MM-dd HH:mm');
      doc.text(dateStr, pageWidth - margin, pageHeight - 10, { align: 'right' });
      doc.setTextColor(0, 0, 0);

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
            <Button onClick={handleDownloadPdf} variant="outline" size="lg" disabled={isGeneratingPdf || loadingExplanations || explanations.some(e => !e) || loadingProfile || loadingCheatingLogs}>
              {isGeneratingPdf || loadingExplanations || explanations.some(e => !e) || loadingProfile || loadingCheatingLogs ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating PDF...</>
              ) : (
                <><Download className="mr-2 h-5 w-5" /> Download PDF</>
              )}
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
                      speakQuestion={() => {}}
                      isSpeaking={false}
                      isTextToSpeechEnabled={false}
                    />
                    <div className="mt-2 text-sm text-muted-foreground">
                      {loadingExplanations ? 'Loading explanation...' : explanations[index] || 'Explanation not available.'}
                    </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
