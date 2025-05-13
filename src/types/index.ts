
import type { GenerateQuizQuestionsInput } from '@/ai/flows/generate-quiz-questions';

export interface QuizQuestion {
  id: string; // Unique ID for the question (e.g., generated UUID)
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean; // Determined after user answers
}

export interface Quiz {
  id: string; // Unique ID for the quiz (e.g., generated UUID)
  topic: string;
  subtopic?: string; // Optional: Specific subtopic
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  config: GenerateQuizQuestionsInput; // Original input to AI, now includes new fields
  createdAt: number; // Timestamp
  score?: number; // Calculated after completion
  completedAt?: number; // Timestamp
  currentQuestionIndex: number; // To track progress
  timeLimit?: number; // Optional: total quiz time limit in minutes
  totalTimeTaken?: number; // Optional: seconds
  challengerName?: string; // Optional: name of the user who challenged
  additionalInstructions?: string; // Optional: instructions given to AI
  isPublic?: boolean; // Optional: whether the quiz is public
}

// For storing quizzes in localStorage, we might simplify or store an array of Quizzes.
// For QuizContext, we might store the activeQuiz: Quiz | null.

