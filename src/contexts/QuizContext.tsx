
"use client";

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Quiz, QuizQuestion } from "@/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid'; // Needs: npm install uuid && npm install @types/uuid

interface QuizContextType {
  activeQuiz: Quiz | null;
  isLoadingQuiz: boolean;
  startQuiz: (quizData: Omit<Quiz, 'id' | 'createdAt' | 'currentQuestionIndex' | 'questions'> & { questions: Omit<QuizQuestion, 'id'>[] }) => string;
  answerQuestion: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitQuiz: () => void;
  loadQuizFromStorage: (quizId: string) => Quiz | null;
  clearActiveQuiz: () => void;
  allQuizzes: Quiz[]; // For potentially listing past quizzes
  deleteQuiz: (quizId: string) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [allQuizzes, setAllQuizzes] = useLocalStorage<Quiz[]>("mindmash-quizzes", []);
  const router = useRouter();

  const startQuiz = useCallback((quizData: Omit<Quiz, 'id' | 'createdAt' | 'currentQuestionIndex' | 'questions'> & { questions: Omit<QuizQuestion, 'id'>[] }): string => {
    setIsLoadingQuiz(true);
    const newQuizId = uuidv4();
    const enrichedQuestions = quizData.questions.map(q => ({...q, id: uuidv4()}));
    const newQuiz: Quiz = {
      ...quizData,
      id: newQuizId,
      questions: enrichedQuestions,
      createdAt: Date.now(),
      currentQuestionIndex: 0,
    };
    setActiveQuiz(newQuiz);
    setAllQuizzes(prev => [newQuiz, ...prev.filter(q => q.id !== newQuizId)]);
    setIsLoadingQuiz(false);
    return newQuizId;
  }, [setAllQuizzes]);

  const answerQuestion = useCallback((questionId: string, answer: string) => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz) return null;
      const updatedQuestions = prevQuiz.questions.map(q =>
        q.id === questionId ? { ...q, userAnswer: answer } : q
      );
      return { ...prevQuiz, questions: updatedQuestions };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz || prevQuiz.currentQuestionIndex >= prevQuiz.questions.length - 1) {
        return prevQuiz;
      }
      return { ...prevQuiz, currentQuestionIndex: prevQuiz.currentQuestionIndex + 1 };
    });
  }, []);

  const previousQuestion = useCallback(() => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz || prevQuiz.currentQuestionIndex <= 0) {
        return prevQuiz;
      }
      return { ...prevQuiz, currentQuestionIndex: prevQuiz.currentQuestionIndex - 1 };
    });
  }, []);

  const submitQuiz = useCallback(() => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz) return null;
      let score = 0;
      const updatedQuestions = prevQuiz.questions.map(q => {
        const isCorrect = q.userAnswer === q.correctAnswer;
        if (isCorrect) score++;
        return { ...q, isCorrect };
      });
      const completedQuiz = {
        ...prevQuiz,
        questions: updatedQuestions,
        score,
        completedAt: Date.now(),
      };
      setAllQuizzes(prev => prev.map(q => q.id === completedQuiz.id ? completedQuiz : q));
      router.push(`/results/${completedQuiz.id}`);
      return completedQuiz; // Return it so the page can use it immediately if needed
    });
  }, [router, setAllQuizzes]);

  const loadQuizFromStorage = useCallback((quizId: string): Quiz | null => {
    setIsLoadingQuiz(true);
    const quiz = allQuizzes.find(q => q.id === quizId);
    if (quiz) {
      setActiveQuiz(quiz);
      setIsLoadingQuiz(false);
      return quiz;
    }
    setIsLoadingQuiz(false);
    return null;
  }, [allQuizzes]);

  const clearActiveQuiz = useCallback(() => {
    setActiveQuiz(null);
  }, []);

  const deleteQuiz = useCallback((quizId: string) => {
    setAllQuizzes(prev => prev.filter(q => q.id !== quizId));
    if (activeQuiz?.id === quizId) {
      setActiveQuiz(null);
    }
  }, [setAllQuizzes, activeQuiz]);

  // Persist activeQuiz to localStorage to handle page refresh during a quiz
  useEffect(() => {
    if (activeQuiz) {
      // This is a simple approach; more robust would be to update the specific quiz in allQuizzes
      const tempQuiz = { ...activeQuiz }; // Don't directly mutate, ensure it's a new object for local storage
      localStorage.setItem('mindmash-active-quiz-temp', JSON.stringify(tempQuiz));
    } else {
      localStorage.removeItem('mindmash-active-quiz-temp');
    }
  }, [activeQuiz]);

  // Rehydrate activeQuiz from localStorage on initial load if it exists
  useEffect(() => {
    const savedActiveQuiz = localStorage.getItem('mindmash-active-quiz-temp');
    if (savedActiveQuiz) {
      try {
        const parsedQuiz = JSON.parse(savedActiveQuiz) as Quiz;
        // Basic validation
        if (parsedQuiz.id && parsedQuiz.questions && typeof parsedQuiz.currentQuestionIndex === 'number') {
           // Only set if not completed, or if on results page for that quiz
          if (!parsedQuiz.completedAt || window.location.pathname.startsWith(`/results/${parsedQuiz.id}`) || window.location.pathname.startsWith(`/quiz/${parsedQuiz.id}`)) {
            setActiveQuiz(parsedQuiz);
          } else {
             localStorage.removeItem('mindmash-active-quiz-temp'); // Clean up completed quiz from temp active storage
          }
        }
      } catch (e) {
        console.error("Failed to parse active quiz from localStorage", e);
        localStorage.removeItem('mindmash-active-quiz-temp');
      }
    }
  }, []);


  return (
    <QuizContext.Provider value={{ activeQuiz, isLoadingQuiz, startQuiz, answerQuestion, nextQuestion, previousQuestion, submitQuiz, loadQuizFromStorage, clearActiveQuiz, allQuizzes, deleteQuiz }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
}

