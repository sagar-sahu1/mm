import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// --- IndexedDB Quiz Answer Storage for Offline Support ---
// Use idb-keyval for simple IndexedDB usage
import { set as idbSet, get as idbGet, del as idbDel, update as idbUpdate, keys as idbKeys } from 'idb-keyval';

const OFFLINE_QUIZ_ANSWERS_KEY = 'offline-quiz-answers';

type QuizAnswer = string | number | boolean | null;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Save an answer for a quiz (by quizId and questionId)
export async function saveOfflineQuizAnswer(quizId: string, questionId: string, answer: QuizAnswer) {
  const all = (await idbGet(OFFLINE_QUIZ_ANSWERS_KEY)) || {};
  if (!all[quizId]) all[quizId] = {};
  all[quizId][questionId] = answer;
  await idbSet(OFFLINE_QUIZ_ANSWERS_KEY, all);
}

// Get all offline answers for a quiz
export async function getOfflineQuizAnswers(quizId: string): Promise<Record<string, QuizAnswer>> {
  const all = (await idbGet(OFFLINE_QUIZ_ANSWERS_KEY)) || {};
  return all[quizId] || {};
}

// Remove all offline answers for a quiz (after sync)
export async function clearOfflineQuizAnswers(quizId: string) {
  const all = (await idbGet(OFFLINE_QUIZ_ANSWERS_KEY)) || {};
  delete all[quizId];
  await idbSet(OFFLINE_QUIZ_ANSWERS_KEY, all);
}

// Get all quizIds with offline answers
export async function getAllOfflineQuizIds(): Promise<string[]> {
  const all = (await idbGet(OFFLINE_QUIZ_ANSWERS_KEY)) || {};
  return Object.keys(all);
}
