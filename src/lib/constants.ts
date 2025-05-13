
export const QUIZ_DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

export type QuizDifficulty = typeof QUIZ_DIFFICULTY_LEVELS[number]['value'];

export const DEFAULT_NUMBER_OF_QUESTIONS = 10;
export const MIN_QUESTIONS = 1;
export const MAX_QUESTIONS = 20;

export const DEFAULT_QUIZ_TIMER_SECONDS = 30; // Per question, if implemented
