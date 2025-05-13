
export const QUIZ_DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

export type QuizDifficulty = typeof QUIZ_DIFFICULTY_LEVELS[number]['value'];

export const DEFAULT_NUMBER_OF_QUESTIONS = 10;
export const MIN_QUESTIONS = 1;
export const MAX_QUESTIONS = 20; // This was the previous max for slider, but select options go up to 20. AI Flow max is 50.
                                // The form schema for numberOfQuestions is now max 50.

export const NUMBER_OF_QUESTIONS_OPTIONS = [
    { value: 5, label: "5 Questions" },
    { value: 10, label: "10 Questions" },
    { value: 15, label: "15 Questions" },
    { value: 20, label: "20 Questions" },
    // { value: 25, label: "25 Questions" }, // AI supports up to 50, can add more if needed
] as const;


export const TIME_LIMIT_OPTIONS = [
    { value: 5, label: "5 Minutes" },
    { value: 10, label: "10 Minutes" },
    { value: 15, label: "15 Minutes" },
    { value: 20, label: "20 Minutes" },
    { value: 30, label: "30 Minutes" },
    // { value: 0, label: "No Time Limit" } // Represented by undefined or a specific value like 0 in form.
] as const;


export const DEFAULT_QUIZ_TIMER_SECONDS = 30; // Per question, if implemented. This is separate from total quiz time limit.

