
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuiz } from '@/contexts/QuizContext';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, ListChecks, FileX, RotateCcw, Eye, LogIn, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation'; // Import useRouter

export default function QuizHistoryPage() {
  const { allQuizzes, deleteQuiz, clearAllCompletedQuizzes } = useQuiz();
  const { currentUser, loading: authLoading } = useAuth(); // Get auth state
  const router = useRouter(); // Initialize router

  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (isClient && !authLoading && !currentUser) {
      router.push('/login?redirect=/history');
    }
  }, [isClient, authLoading, currentUser, router]);

  const completedQuizzes = allQuizzes
    .filter(quiz => quiz.completedAt) // Only show quizzes associated with the current user if you link quizzes to users in the future
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  const handleDelete = () => {
    if (quizToDelete) {
      deleteQuiz(quizToDelete);
      setQuizToDelete(null);
    }
  };

  const handleClearAll = () => {
    clearAllCompletedQuizzes();
    setShowClearAllConfirm(false);
  };

  if (!isClient || authLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p>Loading history...</p>
      </div>
    );
  }

  if (!currentUser) {
    // This state should ideally be caught by the redirect, but as a fallback:
    return (
      <div className="flex flex-col justify-center items-center h-64 text-center">
        <CardTitle className="text-2xl mb-2">Access Denied</CardTitle>
        <CardDescription className="mb-4">You need to be logged in to view your quiz history.</CardDescription>
        <Button asChild>
          <Link href="/login?redirect=/history">
            <LogIn className="mr-2 h-4 w-4" /> Login
          </Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-3xl font-bold flex items-center">
              <ListChecks className="mr-3 h-8 w-8 text-primary" />
              Quiz History
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Review your past quiz performance.
            </CardDescription>
          </div>
          {completedQuizzes.length > 0 && (
            <AlertDialog open={showClearAllConfirm} onOpenChange={setShowClearAllConfirm}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" /> Clear All History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete all your completed quiz history from this device. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                    Yes, Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {completedQuizzes.length === 0 ? (
            <div className="text-center py-10">
              <FileX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Quiz History Yet</h3>
              <p className="text-muted-foreground mb-6">
                Looks like you haven&apos;t completed any quizzes. Start one now!
              </p>
              <Button asChild>
                <Link href="/create-quiz">
                  <RotateCcw className="mr-2 h-4 w-4" /> Create a Quiz
                </Link>
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-300px)] pr-4"> {/* Adjust height as needed */}
              <div className="space-y-4">
                {completedQuizzes.map((quiz) => (
                  <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{quiz.topic}</CardTitle>
                          <CardDescription>
                            Completed on: {format(new Date(quiz.completedAt!), 'PPpp')}
                          </CardDescription>
                        </div>
                         <Badge variant={quiz.score! / quiz.questions.length >= 0.7 ? "default" : (quiz.score! / quiz.questions.length >= 0.4 ? "secondary" : "destructive")} className="text-sm">
                           Score: {quiz.score} / {quiz.questions.length} ({Math.round((quiz.score! / quiz.questions.length) * 100)}%)
                         </Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex justify-end gap-2">
                       <Button variant="outline" size="sm" asChild>
                         <Link href={`/results/${quiz.id}`}>
                           <Eye className="mr-2 h-4 w-4" /> View Results
                         </Link>
                       </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setQuizToDelete(quiz.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the results for the "{quiz.topic}" quiz? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setQuizToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                              Confirm Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
