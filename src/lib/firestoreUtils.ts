
import { doc, setDoc, getDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { QuizQuestion, QuizDifficulty } from '@/types';

export interface ChallengeData {
  slug: string;
  topic: string;
  subtopic?: string;
  difficulty: QuizDifficulty;
  numberOfQuestions: number;
  timeLimit?: number; // in minutes
  additionalInstructions?: string;
  questions: QuizQuestion[];
  challengerUid: string;
  challengerName?: string;
  createdAt: Timestamp;
  isPublic?: boolean;
}

export async function addChallenge(
  challengeDetails: Omit<ChallengeData, 'createdAt' | 'slug' | 'questions'> & { questions: QuizQuestion[] }, // Ensure questions is part of input details
  slug: string
): Promise<void> {
  const db = getDb();
  const challengeRef = doc(db, 'challenges', slug);
  
  // Construct the document data, explicitly handling optional fields
  // to avoid passing undefined directly to Firestore if not desired, though Firestore handles it.
  const dataToSet: Omit<ChallengeData, 'createdAt' | 'slug'> & { slug: string; createdAt: Timestamp } = {
    topic: challengeDetails.topic,
    difficulty: challengeDetails.difficulty,
    numberOfQuestions: challengeDetails.numberOfQuestions,
    questions: challengeDetails.questions,
    challengerUid: challengeDetails.challengerUid,
    slug: slug,
    createdAt: serverTimestamp() as Timestamp, // Firestore will set this
  };

  if (challengeDetails.subtopic) dataToSet.subtopic = challengeDetails.subtopic;
  if (challengeDetails.timeLimit !== undefined) dataToSet.timeLimit = challengeDetails.timeLimit; // Allow 0 for no limit if that's the convention
  if (challengeDetails.additionalInstructions) dataToSet.additionalInstructions = challengeDetails.additionalInstructions;
  if (challengeDetails.challengerName) dataToSet.challengerName = challengeDetails.challengerName;
  if (challengeDetails.isPublic !== undefined) dataToSet.isPublic = challengeDetails.isPublic;


  await setDoc(challengeRef, dataToSet);
}

export async function getChallengeBySlug(slug: string): Promise<ChallengeData | null> {
  const db = getDb();
  const challengeRef = doc(db, 'challenges', slug);
  const challengeSnap = await getDoc(challengeRef);

  if (challengeSnap.exists()) {
    // Ensure all fields, including optional ones, are correctly typed from Firestore data
    const data = challengeSnap.data();
    return {
        slug: data.slug,
        topic: data.topic,
        subtopic: data.subtopic, // Will be undefined if not present
        difficulty: data.difficulty,
        numberOfQuestions: data.numberOfQuestions,
        timeLimit: data.timeLimit, // Will be undefined if not present
        additionalInstructions: data.additionalInstructions, // Will be undefined if not present
        questions: data.questions,
        challengerUid: data.challengerUid,
        challengerName: data.challengerName, // Will be undefined if not present
        createdAt: data.createdAt as Timestamp, // Cast if necessary, Firestore timestamp
        isPublic: data.isPublic, // Will be undefined if not present
    } as ChallengeData;
  } else {
    return null;
  }
}

