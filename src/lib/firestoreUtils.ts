
import { doc, setDoc, getDoc, serverTimestamp, type Timestamp, updateDoc, collection, query, where, getDocs, limit, orderBy, addDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { QuizQuestion, QuizDifficulty, UserProfileFirestoreData, UserProfile } from '@/types';
import { endOfYear, startOfYear } from 'date-fns';

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

export interface UserActivityLog {
  uid: string;
  timestamp: Timestamp;
  date: string; // YYYY-MM-DD
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
  await setDoc(userProfileRef, dataToUpdate, { merge: true });
}

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

// Leaderboard function
export async function getLeaderboardUsers(limitCount: number = 10): Promise<UserProfile[]> {
  const db = getDb();
  const usersRef = collection(db, 'users');
  // IMPORTANT: This query requires a composite index in Firestore.
  // If you see an error in the Firebase console logs or in the browser console
  // similar to "The query requires an index. You can create it here: ...",
  // please follow the link provided in the error message to create the necessary index.
  // The index will likely be on the 'users' collection, with fields:
  // 1. totalScore (Descending)
  // 2. quizzesCompleted (Descending)
  // 3. __name__ (Ascending or Descending, usually Ascending is fine for tie-breaking)
  // The error message provides the exact link like:
  // https://console.firebase.google.com/v1/r/project/YOUR_PROJECT_ID/firestore/indexes?create_composite=...
  const q = query(
    usersRef, 
    orderBy('totalScore', 'desc'), 
    orderBy('quizzesCompleted', 'desc'),
    limit(limitCount)
  );

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
        totalScore: data.totalScore || 0,
        quizzesCompleted: data.quizzesCompleted || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });
    return users;
  } catch (error) {
    console.error("Error fetching leaderboard users:", error);
    if (error instanceof Error && (error.message.includes('firestore/indexes') || ((error as any).code === 'failed-precondition' && error.message.includes('query requires an index')))) {
      console.warn("Firestore index missing for leaderboard query. Please create the required composite index in your Firebase console. The error message often provides a direct link. The index needed is likely for the 'users' collection, ordering by 'totalScore' (descending), then 'quizzesCompleted' (descending).");
    }
    return [];
  }
}

// User Activity Log Functions
export async function recordUserLogin(uid: string): Promise<void> {
  const db = getDb();
  const activityLogRef = collection(db, 'users', uid, 'activityLog');
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // Optional: Check if a login for today already exists to prevent multiple entries per day if desired
  // For simplicity, this example adds a log for every login event.
  // If you want to track "active days" rather than "number of logins", you might want to upsert based on the 'date'.

  try {
    await addDoc(activityLogRef, {
      uid: uid,
      timestamp: serverTimestamp() as Timestamp,
      date: dateString, // Storing date string for easier querying by date range
    });
  } catch (error) {
    console.error("Error recording user login activity:", error);
  }
}

export async function getUserLoginActivity(uid: string, year: number): Promise<UserActivityLog[]> {
  const db = getDb();
  const activityLogRef = collection(db, 'users', uid, 'activityLog');
  
  // Create date range for the given year
  const startDate = startOfYear(new Date(year, 0, 1));
  const endDate = endOfYear(new Date(year, 11, 31));

  const q = query(
    activityLogRef,
    where('uid', '==', uid),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate),
    orderBy('timestamp', 'asc')
  );

  try {
    const querySnapshot = await getDocs(q);
    const activities: UserActivityLog[] = [];
    querySnapshot.forEach((docSnap) => {
      activities.push(docSnap.data() as UserActivityLog);
    });
    return activities;
  } catch (error) {
    console.error(`Error fetching user activity for year ${year}:`, error);
     if (error instanceof Error && (error.message.includes('firestore/indexes') || ((error as any).code === 'failed-precondition' && error.message.includes('query requires an index')))) {
      console.warn(`Firestore index missing for activity log query. Please create a composite index for the 'activityLog' subcollection (under 'users'). The index needed is likely on 'uid' (ascending), then 'timestamp' (ascending).`);
    }
    return [];
  }
}
