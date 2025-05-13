
"use client";

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Quiz, QuizQuestion } from "@/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
// import { useRouter } from "next/navigation"; // Not directly used here for navigation after submitQuiz
import { v4 as uuidv4 } from 'uuid';
import type { GenerateQuizQuestionsInput } from '@/ai/flows/generate-quiz-questions';


interface StartQuizData extends Omit<Quiz, 'id' | 'createdAt' | 'currentQuestionIndex' | 'questions' | 'config' | 'timeLimitMinutes' | 'perQuestionTimeSeconds'> {
  questions: Omit<QuizQuestion, 'id'>[]; // Raw questions from AI
  config: GenerateQuizQuestionsInput; // AI input config
  challengerName?: string;
  // Add new fields from the form
  subtopic?: string;
  timeLimit?: number; // in minutes from form, maps to timeLimitMinutes
  additionalInstructions?: string;
  isPublic?: boolean;
}


interface QuizContextType {
  activeQuiz: Quiz | null;
  isLoadingQuiz: boolean;
  startQuiz: (quizData: StartQuizData) => string;
  answerQuestion: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  navigateToQuestion: (questionIndex: number) => void; // Added for direct navigation
  submitQuiz: () => void;
  loadQuizFromStorage: (quizId: string) => Quiz | null;
  clearActiveQuiz: () => void;
  allQuizzes: Quiz[];
  deleteQuiz: (quizId: string) => void;
  clearAllCompletedQuizzes: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [allQuizzes, setAllQuizzes] = useLocalStorage<Quiz[]>("mindmash-quizzes", []);
  // const router = useRouter(); // Not directly used here for navigation after submitQuiz

  const startQuiz = useCallback((quizData: StartQuizData): string => {
    setIsLoadingQuiz(true);
    const newQuizId = uuidv4();
    const enrichedQuestions = quizData.questions.map(q => ({...q, id: uuidv4()}));
    
    let perQuestionTimeSeconds: number | undefined = undefined;
    if (quizData.timeLimit !== undefined && quizData.timeLimit > 0 && enrichedQuestions.length > 0) {
      perQuestionTimeSeconds = Math.floor((quizData.timeLimit * 60) / enrichedQuestions.length);
      if (perQuestionTimeSeconds < 10) perQuestionTimeSeconds = 10; // Minimum 10 seconds per question if total time is very short
    }

    const newQuiz: Quiz = {
      id: newQuizId,
      topic: quizData.topic,
      subtopic: quizData.subtopic,
      difficulty: quizData.difficulty,
      questions: enrichedQuestions,
      config: quizData.config, 
      createdAt: Date.now(),
      currentQuestionIndex: 0,
      challengerName: quizData.challengerName,
      timeLimitMinutes: quizData.timeLimit, // Store the original time limit from form
      perQuestionTimeSeconds: perQuestionTimeSeconds, // Store calculated per question time
      additionalInstructions: quizData.additionalInstructions,
      isPublic: quizData.isPublic,
    };
    setActiveQuiz(newQuiz);
    setAllQuizzes(prev => [newQuiz, ...prev.filter(q => q.id !== newQuizId)]);
    setIsLoadingQuiz(false);
    return newQuizId;
  }, [setAllQuizzes]);

  const answerQuestion = useCallback((questionId: string, answer: string) => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz || prevQuiz.completedAt) return prevQuiz; // Don't update if already completed
      const updatedQuestions = prevQuiz.questions.map(q =>
        q.id === questionId ? { ...q, userAnswer: answer } : q
      );
      const updatedQuiz = { ...prevQuiz, questions: updatedQuestions };
      // Also update in allQuizzes for persistence if quiz is interrupted
      setAllQuizzes(prevAll => prevAll.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
      return updatedQuiz;
    });
  }, [setAllQuizzes]);

  const nextQuestion = useCallback(() => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz || prevQuiz.completedAt || prevQuiz.currentQuestionIndex >= prevQuiz.questions.length - 1) {
        return prevQuiz;
      }
      const newIndex = prevQuiz.currentQuestionIndex + 1;
      const updatedQuiz = { ...prevQuiz, currentQuestionIndex: newIndex };
      setAllQuizzes(prevAll => prevAll.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
      return updatedQuiz;
    });
  }, [setAllQuizzes]);

  const previousQuestion = useCallback(() => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz || prevQuiz.completedAt || prevQuiz.currentQuestionIndex <= 0) {
        return prevQuiz;
      }
      const newIndex = prevQuiz.currentQuestionIndex - 1;
      const updatedQuiz = { ...prevQuiz, currentQuestionIndex: newIndex };
      setAllQuizzes(prevAll => prevAll.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
      return updatedQuiz;
    });
  }, [setAllQuizzes]);

  const navigateToQuestion = useCallback((questionIndex: number) => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz || questionIndex < 0 || questionIndex >= prevQuiz.questions.length || prevQuiz.completedAt) {
        return prevQuiz; 
      }
      const updatedQuiz = { ...prevQuiz, currentQuestionIndex: questionIndex };
      setAllQuizzes(prevAll => prevAll.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
      return updatedQuiz;
    });
  }, [setAllQuizzes]);

  const submitQuiz = useCallback(() => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz || prevQuiz.completedAt) return prevQuiz; // Avoid double submission
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
      // Remove from active quiz temp storage after submission
      localStorage.removeItem('mindmash-active-quiz-temp');
      return completedQuiz; 
    });
  }, [setAllQuizzes]);

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
    localStorage.removeItem('mindmash-active-quiz-temp');
  }, []);

  const deleteQuiz = useCallback((quizId: string) => {
    setAllQuizzes(prev => prev.filter(q => q.id !== quizId));
    if (activeQuiz?.id === quizId) {
      setActiveQuiz(null);
      localStorage.removeItem('mindmash-active-quiz-temp');
    }
  }, [setAllQuizzes, activeQuiz]);

  const clearAllCompletedQuizzes = useCallback(() => {
    setAllQuizzes(prev => prev.filter(q => !q.completedAt));
    if (activeQuiz && activeQuiz.completedAt) {
      setActiveQuiz(null);
      localStorage.removeItem('mindmash-active-quiz-temp');
    }
  }, [setAllQuizzes, activeQuiz]);

  // Persist active quiz to local storage for resilience against refreshes, but not if completed
  useEffect(() => {
    if (activeQuiz && !activeQuiz.completedAt) {
      localStorage.setItem('mindmash-active-quiz-temp', JSON.stringify(activeQuiz));
    } else if (activeQuiz && activeQuiz.completedAt) {
      // If quiz gets completed, remove it from the temp active storage
      localStorage.removeItem('mindmash-active-quiz-temp');
    }
  }, [activeQuiz]);

  // Load active quiz from local storage on initial mount if not completed
  useEffect(() => {
    const savedActiveQuiz = localStorage.getItem('mindmash-active-quiz-temp');
    if (savedActiveQuiz) {
      try {
        const parsedQuiz = JSON.parse(savedActiveQuiz) as Quiz;
        // Only load if it's a valid quiz object and not completed
        if (parsedQuiz.id && parsedQuiz.questions && typeof parsedQuiz.currentQuestionIndex === 'number' && !parsedQuiz.completedAt) {
          // Check if we are on the quiz page for this quiz, otherwise don't load it as active
           if (window.location.pathname.startsWith(`/quiz/${parsedQuiz.id}`)) {
             setActiveQuiz(parsedQuiz);
           } else {
             // If not on the quiz page, perhaps clear it to avoid stale active quiz
             localStorage.removeItem('mindmash-active-quiz-temp');
           }
        } else if (parsedQuiz.completedAt) {
            // If it was completed but somehow still in temp storage, remove it
            localStorage.removeItem('mindmash-active-quiz-temp');
        }
      } catch (e) {
        console.error("Failed to parse active quiz from localStorage", e);
        localStorage.removeItem('mindmash-active-quiz-temp');
      }
    }
  }, []);


  return (
    <QuizContext.Provider value={{ activeQuiz, isLoadingQuiz, startQuiz, answerQuestion, nextQuestion, previousQuestion, navigateToQuestion, submitQuiz, loadQuizFromStorage, clearActiveQuiz, allQuizzes, deleteQuiz, clearAllCompletedQuizzes }}>
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

