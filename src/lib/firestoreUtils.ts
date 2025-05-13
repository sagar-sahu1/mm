
import { doc, setDoc, getDoc, serverTimestamp, type Timestamp, updateDoc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { QuizQuestion, QuizDifficulty, UserProfileFirestoreData, UserProfile } from '@/types';

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
  
  const dataToSet: Omit<ChallengeData, 'createdAt' | 'slug'> & { slug: string; createdAt: Timestamp } = {
    topic: challengeDetails.topic,
    difficulty: challengeDetails.difficulty,
    numberOfQuestions: challengeDetails.numberOfQuestions,
    questions: challengeDetails.questions,
    challengerUid: challengeDetails.challengerUid,
    slug: slug,
    createdAt: serverTimestamp() as Timestamp, 
  };

  if (challengeDetails.subtopic) dataToSet.subtopic = challengeDetails.subtopic;
  if (challengeDetails.timeLimit !== undefined) dataToSet.timeLimit = challengeDetails.timeLimit; 
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
    const data = challengeSnap.data();
    return {
        slug: data.slug,
        topic: data.topic,
        subtopic: data.subtopic, 
        difficulty: data.difficulty,
        numberOfQuestions: data.numberOfQuestions,
        timeLimit: data.timeLimit, 
        additionalInstructions: data.additionalInstructions, 
        questions: data.questions,
        challengerUid: data.challengerUid,
        challengerName: data.challengerName, 
        createdAt: data.createdAt as Timestamp, 
        isPublic: data.isPublic, 
    } as ChallengeData;
  } else {
    return null;
  }
}

// User Profile Functions

export async function getUserProfile(uid: string): Promise<UserProfileFirestoreData | null> {
  const db = getDb();
  const userProfileRef = doc(db, 'users', uid);
  const userProfileSnap = await getDoc(userProfileRef);

  if (userProfileSnap.exists()) {
    return userProfileSnap.data() as UserProfileFirestoreData;
  } else {
    return null;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfileFirestoreData>): Promise<void> {
  const db = getDb();
  const userProfileRef = doc(db, 'users', uid);
  const dataToUpdate = {
    ...data,
    updatedAt: serverTimestamp() as Timestamp,
  };
  // Use setDoc with merge: true to create the document if it doesn't exist, or update if it does.
  await setDoc(userProfileRef, dataToUpdate, { merge: true });
}

// Example for creating a user profile document, typically on signup or first profile save.
export async function createUserProfileDocument(uid: string, data: UserProfileFirestoreData): Promise<void> {
    const db = getDb();
    const userProfileRef = doc(db, 'users', uid);
    const profileDataWithTimestamp = {
        ...data,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
    };
    await setDoc(userProfileRef, profileDataWithTimestamp);
}

// Leaderboard function (Placeholder - requires more complex logic based on scoring criteria)
export async function getLeaderboardUsers(limitCount: number = 10): Promise<UserProfile[]> {
  const db = getDb();
  const usersRef = collection(db, 'users');
  // This is a simplified query. Real leaderboard might need to query based on aggregated scores,
  // which could involve a separate 'userScores' collection or denormalized data.
  // For now, let's assume 'users' collection has a 'totalScore' field or similar for ranking.
  // This example assumes 'totalScore' and 'displayName' exist. Adapt as needed.
  const q = query(usersRef, orderBy('displayName'), limit(limitCount)); // Placeholder: order by displayName

  try {
    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as UserProfileFirestoreData;
      users.push({
        uid: docSnap.id,
        email: data.email || null,
        displayName: data.displayName,
        photoURL: data.photoURL,
        bio: data.bio,
        birthdate: data.birthdate,
        socialLinks: data.socialLinks,
        // Add other fields like score, accuracy if available directly on user doc or from a related calculation
      });
    });
    return users;
  } catch (error) {
    console.error("Error fetching leaderboard users:", error);
    return [];
  }
}
