
import { doc, setDoc, getDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { QuizQuestion, QuizDifficulty } from '@/types';

export interface ChallengeData {
  slug: string;
  topic: string;
  difficulty: QuizDifficulty;
  numberOfQuestions: number;
  questions: QuizQuestion[]; // Assuming QuizQuestion matches the structure from GenAI output closely
  challengerUid: string;
  challengerName?: string;
  createdAt: Timestamp;
}

export async function addChallenge(challengeData: Omit<ChallengeData, 'createdAt' | 'slug'>, slug: string): Promise<void> {
  const db = getDb();
  const challengeRef = doc(db, 'challenges', slug);
  await setDoc(challengeRef, {
    ...challengeData,
    slug, // ensure slug is part of the document data
    createdAt: serverTimestamp(),
  });
}

export async function getChallengeBySlug(slug: string): Promise<ChallengeData | null> {
  const db = getDb();
  const challengeRef = doc(db, 'challenges', slug);
  const challengeSnap = await getDoc(challengeRef);

  if (challengeSnap.exists()) {
    return challengeSnap.data() as ChallengeData;
  } else {
    return null;
  }
}
