'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Quiz, QuizQuestion } from "@/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { v4 as uuidv4 } from 'uuid';
import type { GenerateQuizQuestionsInput } from '@/ai/flows/generate-quiz-questions';


interface StartQuizData extends Omit<Quiz, 'id' | 'createdAt' | 'currentQuestionIndex' | 'questions' | 'config' | 'timeLimitMinutes' | 'perQuestionTimeSeconds' | 'startedAt'> {
  questions: Omit<QuizQuestion, 'id'>[];
  config: GenerateQuizQuestionsInput; 
  challengerName?: string;
  subtopic?: string;
  timeLimit?: number; 
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
  navigateToQuestion: (questionIndex: number) => void;
  submitQuiz: () => void;
  loadQuizFromStorage: (quizId: string) => Quiz | null;
  markQuizAsStarted: (quizId: string) => void; // New function
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

  const startQuiz = useCallback((quizData: StartQuizData): string => {
    setIsLoadingQuiz(true);
    const newQuizId = uuidv4();
    const enrichedQuestions = quizData.questions.map(q => ({...q, id: uuidv4()}));
    
    let perQuestionTimeSeconds: number | undefined = undefined;
    if (quizData.timeLimit && quizData.timeLimit > 0 && enrichedQuestions.length > 0) {
      perQuestionTimeSeconds = Math.floor((quizData.timeLimit * 60) / enrichedQuestions.length);
      if (perQuestionTimeSeconds < 10) perQuestionTimeSeconds = 10; 
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
      timeLimitMinutes: quizData.timeLimit, 
      perQuestionTimeSeconds: perQuestionTimeSeconds, 
      additionalInstructions: quizData.additionalInstructions,
      isPublic: quizData.isPublic,
      // startedAt will be set by markQuizAsStarted when the quiz page loads
    };
    setActiveQuiz(newQuiz); // Set as new object
    setAllQuizzes(prev => [newQuiz, ...prev.filter(q => q.id !== newQuizId)]);
    setIsLoadingQuiz(false);
    return newQuizId;
  }, [setAllQuizzes]);

  const answerQuestion = useCallback((questionId: string, answer: string) => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz || prevQuiz.completedAt) return prevQuiz; 
      const updatedQuestions = prevQuiz.questions.map(q =>
        q.id === questionId ? { ...q, userAnswer: answer } : q
      );
      const updatedQuiz = { ...prevQuiz, questions: updatedQuestions };
      setAllQuizzes(prevAll => prevAll.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
      return updatedQuiz; // Return new object
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
      return updatedQuiz; // Return new object
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
      return updatedQuiz; // Return new object
    });
  }, [setAllQuizzes]);

  const navigateToQuestion = useCallback((questionIndex: number) => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz || questionIndex < 0 || questionIndex >= prevQuiz.questions.length || prevQuiz.completedAt) {
        return prevQuiz; 
      }
      const updatedQuiz = { ...prevQuiz, currentQuestionIndex: questionIndex };
      setAllQuizzes(prevAll => prevAll.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
      return updatedQuiz; // Return new object
    });
  }, [setAllQuizzes]);

  const submitQuiz = useCallback(() => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz || prevQuiz.completedAt) return prevQuiz; 
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
        totalTimeTaken: prevQuiz.startedAt ? Math.floor((Date.now() - prevQuiz.startedAt) / 1000) : undefined,
      };
      setAllQuizzes(prev => prev.map(q => q.id === completedQuiz.id ? completedQuiz : q));
      localStorage.removeItem('mindmash-active-quiz-temp');
      return completedQuiz; // Return new object
    });
  }, [setAllQuizzes]);

  // Loads quiz from storage, does not modify it (e.g., set startedAt)
  const loadQuizFromStorage = useCallback((quizId: string): Quiz | null => {
    setIsLoadingQuiz(true);
    const quiz = allQuizzes.find(q => q.id === quizId);
    if (quiz) {
      setActiveQuiz({ ...quiz }); // Create a new object reference
      setIsLoadingQuiz(false);
      return { ...quiz }; // Return a new object reference
    }
    setIsLoadingQuiz(false);
    return null;
  }, [allQuizzes]); // Depends on allQuizzes for finding

  const markQuizAsStarted = useCallback((quizId: string) => {
    setAllQuizzes(prevAll => {
      let changed = false;
      const newAllQuizzes = prevAll.map(q => {
        if (q.id === quizId && q.timeLimitMinutes && q.timeLimitMinutes > 0 && !q.startedAt && !q.completedAt) {
          changed = true;
          const updatedQuiz = { ...q, startedAt: Date.now() };
          // If this is the active quiz, update it directly
          if (activeQuiz && activeQuiz.id === quizId) {
            setActiveQuiz(updatedQuiz); // New object
          }
          return updatedQuiz;
        }
        return q;
      });
      return changed ? newAllQuizzes : prevAll;
    });
  }, [activeQuiz, setAllQuizzes]);


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
  }, [activeQuiz, setAllQuizzes]);

  const clearAllCompletedQuizzes = useCallback(() => {
    setAllQuizzes(prev => prev.filter(q => !q.completedAt));
    if (activeQuiz && activeQuiz.completedAt) {
      setActiveQuiz(null);
      localStorage.removeItem('mindmash-active-quiz-temp');
    }
  }, [activeQuiz, setAllQuizzes]);

  useEffect(() => {
    if (activeQuiz && !activeQuiz.completedAt) {
      localStorage.setItem('mindmash-active-quiz-temp', JSON.stringify(activeQuiz));
    } else if (activeQuiz && activeQuiz.completedAt) {
      // This removal should happen once when quiz is submitted
      localStorage.removeItem('mindmash-active-quiz-temp');
    }
  }, [activeQuiz]);

  // Effect to load an active quiz from localStorage on initial app load / refresh
  useEffect(() => {
    const savedActiveQuizJson = localStorage.getItem('mindmash-active-quiz-temp');
    if (savedActiveQuizJson) {
      try {
        const parsedQuiz = JSON.parse(savedActiveQuizJson) as Quiz;
        // Ensure it's a valid, non-completed quiz object
        if (parsedQuiz && parsedQuiz.id && parsedQuiz.questions && typeof parsedQuiz.currentQuestionIndex === 'number' && !parsedQuiz.completedAt) {
           // Only set if the current page is the quiz page for this quiz
           if (typeof window !== 'undefined' && window.location.pathname.startsWith(`/quiz/${parsedQuiz.id}`)) {
             setActiveQuiz(parsedQuiz); // This will be a new object ref
           } else {
             // Navigated away from the quiz page, so clear the temp active quiz
             localStorage.removeItem('mindmash-active-quiz-temp');
           }
        } else if (parsedQuiz && parsedQuiz.completedAt) {
            // If it's completed, it shouldn't be in active-quiz-temp
            localStorage.removeItem('mindmash-active-quiz-temp');
        }
      } catch (e) {
        console.error("Failed to parse active quiz from localStorage", e);
        localStorage.removeItem('mindmash-active-quiz-temp');
      }
    }
  }, []);


  return (
    <QuizContext.Provider value={{ 
        activeQuiz, 
        isLoadingQuiz, 
        startQuiz, 
        answerQuestion, 
        nextQuestion, 
        previousQuestion, 
        navigateToQuestion, 
        submitQuiz, 
        loadQuizFromStorage,
        markQuizAsStarted, 
        clearActiveQuiz, 
        allQuizzes, 
        deleteQuiz, 
        clearAllCompletedQuizzes 
    }}>
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