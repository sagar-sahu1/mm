
import { doc, setDoc, getDoc, serverTimestamp, type Timestamp, updateDoc, collection, query, where, getDocs, limit, orderBy, addDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { QuizQuestion, QuizDifficulty, UserProfileFirestoreData, UserProfile } from '@/types';
import { endOfYear, startOfYear, format, subDays, isEqual, startOfWeek, addDays as dateFnsAddDays, eachDayOfInterval, differenceInDays } from 'date-fns';

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
      console.warn("Firestore index missing for leaderboard query. Please create the required composite index in your Firebase console using the link provided in the error message. Please create the required composite index in your Firebase console using the link provided in the error message. The index needed is for the 'users' collection (or collection group 'users'), ordering by 'totalScore' (descending), then 'quizzesCompleted' (descending), then by document ID (__name__) (ascending).");
    }
    return [];
  }
}

// User Activity Log Functions
export async function recordUserLogin(uid: string): Promise<void> {
  const db = getDb();
  const activityLogRef = collection(db, 'users', uid, 'activityLog');
  const today = new Date();
  const dateString = format(today, 'yyyy-MM-dd'); 

  try {
    // Check if a login for today already exists to avoid duplicate entries for the same day if needed
    // For simplicity, this example adds a new log for each login event.
    // If you only want one entry per day, you might query first or use the dateString as document ID.
    await addDoc(activityLogRef, {
      uid: uid,
      timestamp: serverTimestamp() as Timestamp,
      date: dateString, 
    });
  } catch (error) {
    console.error("Error recording user login activity:", error);
  }
}

export async function getUniqueLoginDates(uid: string): Promise<string[]> {
  const db = getDb();
  const activityLogRef = collection(db, 'users', uid, 'activityLog');
  // Order by timestamp to process chronologically if needed, though 'date' field is primary for uniqueness
  const q = query(activityLogRef, where('uid', '==', uid), orderBy('timestamp', 'asc'));
  
  try {
    const querySnapshot = await getDocs(q);
    const dateSet = new Set<string>();
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as UserActivityLog;
      if (data.date) { // Ensure date field exists
        dateSet.add(data.date);
      }
    });
    return Array.from(dateSet).sort(); // Return sorted unique dates
  } catch (error) {
    console.error("Error fetching unique login dates:", error);
    return [];
  }
}


export async function getUserLoginActivityForYear(uid: string, year: number): Promise<UserActivityLog[]> {
  const db = getDb();
  const activityLogRef = collection(db, 'users', uid, 'activityLog');
  
  const yearStartDate = startOfYear(new Date(year, 0, 1));
  const yearEndDate = endOfYear(new Date(year, 11, 31));

  const q = query(
    activityLogRef,
    where('uid', '==', uid),
    where('timestamp', '>=', yearStartDate),
    where('timestamp', '<=', yearEndDate),
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
      console.warn(`Firestore index missing for activity log query. Please create the required composite index in your Firebase console using the link provided in the error message. The index needed is for the 'activityLog' subcollection (under 'users', queried as a collection group), on fields 'uid' (ascending), then 'timestamp' (ascending), then by document ID (__name__) (ascending).`);
    }
    return [];
  }
}


export function calculateUserLoginStreak(uniqueLoginDates: string[]): number {
  if (uniqueLoginDates.length === 0) {
    return 0;
  }

  // Ensure dates are sorted for correct streak calculation (YYYY-MM-DD format sorts correctly)
  const sortedDates = [...uniqueLoginDates].sort().reverse(); // Newest first

  let currentStreak = 0;
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  let currentDateToCheck = today;

  // Check if today is a login day
  if (sortedDates[0] === todayStr) {
    currentStreak = 1;
    currentDateToCheck = subDays(today, 1); // Start checking from yesterday
  } else {
    // Check if yesterday was a login day (if today wasn't)
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
    if (sortedDates[0] === yesterdayStr) {
      currentStreak = 0; // Streak broken today, but we'll count from yesterday
      currentDateToCheck = subDays(today, 1);
    } else {
      return 0; // No login today or yesterday
    }
  }
  
  // Iterate backwards from the day before `currentDateToCheck` effectively started from
  let i = (sortedDates[0] === todayStr || sortedDates[0] === format(subDays(today,1), 'yyyy-MM-dd')) ? 1 : 0;
  
  if (sortedDates[0] === format(currentDateToCheck, 'yyyy-MM-dd')) { // If streak is being counted from yesterday
     currentStreak = 1; // Initialize to 1 for yesterday
  }


  for (; i < sortedDates.length; i++) {
    const expectedDateStr = format(currentDateToCheck, 'yyyy-MM-dd');
    if (sortedDates[i] === expectedDateStr) {
      if (sortedDates[0] !== todayStr && currentStreak === 0 && sortedDates[i] === format(subDays(today,1), 'yyyy-MM-dd')) {
         // This is the first day of a streak that ended yesterday
         currentStreak = 1;
      } else if (sortedDates[0] === todayStr || currentStreak > 0) {
         // Only increment if streak has started (either today or continuing from yesterday)
         currentStreak++;
      }
      currentDateToCheck = subDays(currentDateToCheck, 1);
    } else if (differenceInDays(currentDateToCheck, new Date(sortedDates[i])) > 0 ){
      // Gap detected, streak broken
      break;
    }
     // If sortedDates[i] is older than currentDateToCheck, it means there was a gap.
  }
  
  // If today wasn't a login day, but yesterday was, the streak count is for the past.
  // If today IS a login day, currentStreak already counts today.
  if (sortedDates[0] !== todayStr && currentStreak > 0) {
      // If the most recent login wasn't today, the streak is effectively 0 for "today's streak"
      // but the calculated value `currentStreak` is the length of the historical streak ending on `sortedDates[0]`
      // For a "current live streak" display, if today is not a login, streak is 0.
      // The image implies a "current live streak".
      return 0;
  }


  return currentStreak;
}


export function getWeeklyLoginStatus(uniqueLoginDates: string[], referenceDate: Date = new Date()): boolean[] {
  const weekStartsOn = 1; // Monday
  const startOfCurrentWeek = startOfWeek(referenceDate, { weekStartsOn });
  
  const weekDays = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: dateFnsAddDays(startOfCurrentWeek, 6),
  });

  const weeklyStatus = weekDays.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return uniqueLoginDates.includes(dayStr);
  });

  return weeklyStatus; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}
