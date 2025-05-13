
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Quiz, QuizQuestion, QuizTerminationReason } from "@/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { v4 as uuidv4 } from 'uuid';
import type { GenerateQuizQuestionsInput } from '@/ai/flows/generate-quiz-questions';


interface StartQuizData extends Omit<Quiz, 'id' | 'createdAt' | 'currentQuestionIndex' | 'questions' | 'config' | 'timeLimitMinutes' | 'perQuestionTimeSeconds' | 'startedAt' | 'quizTerminationReason' | 'cheatingFlags'> {
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
  submitQuiz: (reason?: QuizTerminationReason) => void;
  loadQuizFromStorage: (quizId: string) => Quiz | null;
  markQuizAsStarted: (quizId: string) => void;
  clearActiveQuiz: () => void;
  allQuizzes: Quiz[];
  deleteQuiz: (quizId: string) => void;
  clearAllCompletedQuizzes: () => void;
  updateActiveQuizCheatingFlags: (count: number) => void;
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
      const totalSecondsForQuiz = quizData.timeLimit * 60;
      perQuestionTimeSeconds = Math.floor(totalSecondsForQuiz / enrichedQuestions.length);
      if (perQuestionTimeSeconds < 10) {
        perQuestionTimeSeconds = 10; 
      }
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
      quizTerminationReason: undefined,
      cheatingFlags: 0,
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

  const submitQuiz = useCallback((reason: QuizTerminationReason = "completed") => {
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
        score: reason === "cheating" ? 0 : score, // Score 0 if terminated for cheating
        completedAt: Date.now(),
        totalTimeTaken: prevQuiz.startedAt ? Math.floor((Date.now() - prevQuiz.startedAt) / 1000) : undefined,
        quizTerminationReason: reason,
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
      setActiveQuiz({ ...quiz }); 
      setIsLoadingQuiz(false);
      return { ...quiz }; 
    }
    setIsLoadingQuiz(false);
    return null;
  }, [allQuizzes]); 

  const markQuizAsStarted = useCallback((quizId: string) => {
    setAllQuizzes(prevAll => {
      let changed = false;
      const newAllQuizzes = prevAll.map(q => {
        if (q.id === quizId && q.timeLimitMinutes && q.timeLimitMinutes > 0 && !q.startedAt && !q.completedAt) {
          changed = true;
          const updatedQuizWithStartTime = { ...q, startedAt: Date.now() };
          if (activeQuiz && activeQuiz.id === quizId) {
            setActiveQuiz(prevActive => prevActive ? { ...prevActive, startedAt: updatedQuizWithStartTime.startedAt } : null);
          }
          return updatedQuizWithStartTime;
        }
        return q;
      });
      return changed ? newAllQuizzes : prevAll;
    });
  }, [activeQuiz, setAllQuizzes, setActiveQuiz]);


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

  const updateActiveQuizCheatingFlags = useCallback((count: number) => {
    setActiveQuiz(prevQuiz => {
      if (!prevQuiz || prevQuiz.completedAt) return prevQuiz;
      const updatedQuiz = { ...prevQuiz, cheatingFlags: count };
      setAllQuizzes(prevAll => prevAll.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
      return updatedQuiz;
    });
  }, [setAllQuizzes]);

  useEffect(() => {
    if (activeQuiz && !activeQuiz.completedAt) {
      localStorage.setItem('mindmash-active-quiz-temp', JSON.stringify(activeQuiz));
    } else if (activeQuiz && activeQuiz.completedAt) {
      localStorage.removeItem('mindmash-active-quiz-temp');
    }
  }, [activeQuiz]);

  useEffect(() => {
    const savedActiveQuizJson = localStorage.getItem('mindmash-active-quiz-temp');
    if (savedActiveQuizJson) {
      try {
        const parsedQuiz = JSON.parse(savedActiveQuizJson) as Quiz;
        if (parsedQuiz && parsedQuiz.id && parsedQuiz.questions && typeof parsedQuiz.currentQuestionIndex === 'number' && !parsedQuiz.completedAt) {
           if (typeof window !== 'undefined' && window.location.pathname.startsWith(`/quiz/${parsedQuiz.id}`)) {
             setActiveQuiz(parsedQuiz); 
           } else {
             localStorage.removeItem('mindmash-active-quiz-temp');
           }
        } else if (parsedQuiz && parsedQuiz.completedAt) {
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
        clearAllCompletedQuizzes,
        updateActiveQuizCheatingFlags
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
