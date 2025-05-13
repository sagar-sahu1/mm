
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Quiz, QuizQuestion } from "@/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
// import { useRouter } from "next/navigation"; // Not directly used here for navigation after submitQuiz
import { v4 as uuidv4 } from 'uuid';
import type { GenerateQuizQuestionsInput } from '@/ai/flows/generate-quiz-questions';


interface StartQuizData extends Omit<Quiz, 'id' | 'createdAt' | 'currentQuestionIndex' | 'questions' | 'config' | 'timeLimitMinutes' | 'perQuestionTimeSeconds' | 'startedAt'> {
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
    // Calculate perQuestionTimeSeconds only if timeLimit is positive and there are questions
    if (quizData.timeLimit && quizData.timeLimit > 0 && enrichedQuestions.length > 0) {
      perQuestionTimeSeconds = Math.floor((quizData.timeLimit * 60) / enrichedQuestions.length);
      // Ensure a minimum time per question, e.g., 10 seconds, if calculated time is too short
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
      startedAt: (quizData.timeLimit !== undefined && quizData.timeLimit > 0) ? Date.now() : undefined, // Set startedAt if there's a time limit
    };
    setActiveQuiz(newQuiz);
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
      return completedQuiz; 
    });
  }, [setAllQuizzes]);

  const loadQuizFromStorage = useCallback((quizId: string): Quiz | null => {
    setIsLoadingQuiz(true);
    const quiz = allQuizzes.find(q => q.id === quizId);
    if (quiz) {
      let loadedQuiz = { ...quiz };
      // If the quiz has a time limit and hasn't been marked as started, mark it now.
      // This is important if the user navigates away and comes back.
      if (loadedQuiz.timeLimitMinutes && loadedQuiz.timeLimitMinutes > 0 && !loadedQuiz.startedAt && !loadedQuiz.completedAt) {
        loadedQuiz.startedAt = Date.now();
        setAllQuizzes(prevAll => prevAll.map(q => q.id === loadedQuiz.id ? loadedQuiz : q));
      }
      setActiveQuiz(loadedQuiz);
      setIsLoadingQuiz(false);
      return loadedQuiz;
    }
    setIsLoadingQuiz(false);
    return null;
  }, [allQuizzes, setAllQuizzes]);

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

  useEffect(() => {
    if (activeQuiz && !activeQuiz.completedAt) {
      localStorage.setItem('mindmash-active-quiz-temp', JSON.stringify(activeQuiz));
    } else if (activeQuiz && activeQuiz.completedAt) {
      localStorage.removeItem('mindmash-active-quiz-temp');
    }
  }, [activeQuiz]);

  useEffect(() => {
    const savedActiveQuiz = localStorage.getItem('mindmash-active-quiz-temp');
    if (savedActiveQuiz) {
      try {
        const parsedQuiz = JSON.parse(savedActiveQuiz) as Quiz;
        if (parsedQuiz.id && parsedQuiz.questions && typeof parsedQuiz.currentQuestionIndex === 'number' && !parsedQuiz.completedAt) {
           if (window.location.pathname.startsWith(`/quiz/${parsedQuiz.id}`)) {
             // If loading a timed quiz that wasn't marked as started, or if startedAt is old, update it.
             let quizToLoad = { ...parsedQuiz };
             if (quizToLoad.timeLimitMinutes && quizToLoad.timeLimitMinutes > 0 && !quizToLoad.startedAt) {
                quizToLoad.startedAt = Date.now();
             }
             setActiveQuiz(quizToLoad);
           } else {
             localStorage.removeItem('mindmash-active-quiz-temp');
           }
        } else if (parsedQuiz.completedAt) {
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

