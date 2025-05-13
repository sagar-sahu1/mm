
import { doc, setDoc, getDoc, serverTimestamp, type Timestamp, updateDoc, collection, query, where, getDocs, limit, orderBy, addDoc, arrayUnion } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { QuizQuestion, QuizDifficulty, UserProfileFirestoreData, UserProfile } from '@/types';
import { endOfYear, startOfYear, format, subDays, isEqual, startOfWeek, addDays as dateFnsAddDays, eachDayOfInterval, differenceInDays, parseISO } from 'date-fns';

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
  timestamp: Timestamp; // Representing the date of activity for heatmap
  date: string; // YYYY-MM-DD format for easy grouping
  count?: number; // For heatmap, this will be 1 for each unique login day.
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

export async function createUserProfileDocument(uid: string, data: Partial<UserProfileFirestoreData>): Promise<void> {
    const db = getDb();
    const userProfileRef = doc(db, 'users', uid);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const profileDataWithTimestamp: UserProfileFirestoreData = {
        email: data.email || undefined,
        displayName: data.displayName || data.email?.split('@')[0] || 'Anonymous User',
        bio: data.bio || '', 
        birthdate: data.birthdate || '',
        socialLinks: data.socialLinks || {},
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        totalScore: 0,
        quizzesCompleted: 0,
        lastLoginAt: serverTimestamp() as Timestamp,
        loginHistory: [todayStr],
        currentStreak: 1,
        lastStreakLoginDate: todayStr,
    };
    await setDoc(userProfileRef, profileDataWithTimestamp);
}

// Leaderboard function
export async function getLeaderboardUsers(limitCount: number = 10): Promise<UserProfile[]> {
  const db = getDb();
  const usersRef = collection(db, 'users');
  // Firestore requires the first orderBy field to be the same as the inequality field if one is used.
  // If no inequality, any field can be first.
  // For complex sorting like by score then by quizzesCompleted, ensure composite index exists.
  const q = query(
    usersRef, 
    orderBy('totalScore', 'desc'), 
    orderBy('quizzesCompleted', 'desc'), // Secondary sort
    // orderBy('displayName', 'asc'), // Optional tertiary sort for tie-breaking if needed
    limit(limitCount)
  );

  try {
    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as UserProfileFirestoreData;
      users.push({
        uid: docSnap.id,
        // Ensure all fields from UserProfile are mapped
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
        lastLoginAt: data.lastLoginAt,
        loginHistory: data.loginHistory,
        currentStreak: data.currentStreak,
        lastStreakLoginDate: data.lastStreakLoginDate,
      });
    });
    return users;
  } catch (error) {
    console.error("Error fetching leaderboard users:", error);
    if (error instanceof Error && (error.message.includes('firestore/indexes') || ((error as any).code === 'failed-precondition' && error.message.includes('query requires an index')))) {
      console.warn("Firestore index missing for leaderboard query. Please create the required composite index in your Firebase console using the link provided in the error message. The index needed is for the 'users' collection, ordering by 'totalScore' (descending), then 'quizzesCompleted' (descending), then by document ID (__name__) (ascending).");
    }
    return [];
  }
}

// User Activity Log Functions
export async function recordUserLogin(uid: string): Promise<void> {
  const db = getDb();
  const userRef = doc(db, 'users', uid);
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-DD');

  try {
    const userSnap = await getDoc(userRef);
    let newStreak = 1;
    let loginHistory: string[] = [];

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfileFirestoreData;
      loginHistory = userData.loginHistory || [];
      if (!loginHistory.includes(todayStr)) {
        loginHistory.push(todayStr);
        loginHistory.sort(); // Keep it sorted for easier processing if needed elsewhere
      }

      const currentStreak = userData.currentStreak || 0;
      const lastStreakLogin = userData.lastStreakLoginDate;

      if (lastStreakLogin) {
        const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-DD');
        if (lastStreakLogin === yesterdayStr) {
          newStreak = currentStreak + 1;
        } else if (lastStreakLogin === todayStr) {
          newStreak = currentStreak; // Already logged in today, streak continues
        } else {
          newStreak = 1; // Streak broken
        }
      } else {
        newStreak = 1; // First login or streak data missing
      }
    } else {
      // This case should ideally be handled by createUserProfileDocument on signup.
      // If a user document doesn't exist at login, something is amiss.
      // For robustness, we could create it here, but it's better handled at signup.
      console.warn(`User document for UID ${uid} not found during login recording.`);
      loginHistory = [todayStr];
      newStreak = 1;
    }
    
    // Limit loginHistory size to avoid overly large documents, e.g., last ~1.5 years
    if (loginHistory.length > 550) {
      loginHistory = loginHistory.slice(loginHistory.length - 550);
    }

    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp() as Timestamp,
      loginHistory: loginHistory,
      currentStreak: newStreak,
      lastStreakLoginDate: todayStr,
      updatedAt: serverTimestamp() as Timestamp,
    });

  } catch (error) {
    console.error("Error recording user login activity:", error);
  }
}

export async function getUniqueLoginDates(uid: string): Promise<string[]> {
  const userProfile = await getUserProfile(uid);
  if (userProfile && userProfile.loginHistory) {
    return userProfile.loginHistory.sort(); // Ensure sorted, though recordUserLogin attempts to sort
  }
  return [];
}


export async function getUserLoginActivityForYear(uid: string, year: number): Promise<UserActivityLog[]> {
  const userProfile = await getUserProfile(uid);
  if (!userProfile || !userProfile.loginHistory) {
    return [];
  }

  const activities: UserActivityLog[] = [];
  userProfile.loginHistory.forEach(dateStr => {
    try {
      const loginDate = parseISO(dateStr); // Assumes YYYY-MM-DD
      if (loginDate.getFullYear() === year) {
        activities.push({
          uid: uid,
          date: dateStr,
          // For heatmap, timestamp ideally represents the start of the day for consistency.
          // Firestore Timestamps are more precise, but for daily activity, this is okay.
          // Creating a JS Date and then converting to Firestore Timestamp if needed:
          // For this use case, we just need the date string for the heatmap.
          // The 'timestamp' field in UserActivityLog here is a bit of a misnomer if we only have dates.
          // Let's provide a pseudo-Timestamp by converting the date string.
          timestamp: Timestamp.fromDate(loginDate), 
          count: 1, // Each unique date in loginHistory counts as 1 activity for the heatmap
        });
      }
    } catch (e) {
      console.warn(`Could not parse date string ${dateStr} from loginHistory for user ${uid}`);
    }
  });
  return activities.sort((a,b) => a.timestamp.toMillis() - b.timestamp.toMillis());
}


export function calculateUserLoginStreak(uniqueLoginDates: string[]): number {
  if (!uniqueLoginDates || uniqueLoginDates.length === 0) {
    return 0;
  }
  
  // Ensure dates are sorted chronologically. getUniqueLoginDates should already do this.
  const sortedDates = [...new Set(uniqueLoginDates)].map(d => parseISO(d)).sort((a,b) => a.getTime() - b.getTime());

  if (sortedDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0,0,0,0); // Normalize today to start of day

  // Check if the latest login is today or yesterday
  const lastLoginDate = sortedDates[sortedDates.length - 1];
  lastLoginDate.setHours(0,0,0,0);

  if (differenceInDays(today, lastLoginDate) > 1) {
    return 0; // Last login was not today or yesterday, so streak is 0.
  }

  let currentStreak = 0;
  // Iterate backwards from the last login date
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const dateToCheck = new Date(sortedDates[i]);
    dateToCheck.setHours(0,0,0,0);
    
    const expectedPreviousDate = subDays( (i === sortedDates.length - 1) ? today : new Date(sortedDates[i+1]), 1);
    expectedPreviousDate.setHours(0,0,0,0);

    if (isEqual(dateToCheck, expectedPreviousDate) || (i === sortedDates.length -1 && isEqual(dateToCheck, today))) {
        currentStreak++;
    } else if (i === sortedDates.length -1 && isEqual(dateToCheck, subDays(today,1))) { // handles if last login was yesterday
        currentStreak++;
    }
     else {
      break; // Gap in dates, streak ends
    }
  }
  
  // If the last login date in sortedDates is not today, and the streak calculation
  // based on consecutive days means the streak should be 0 (e.g., last login was yesterday, but only yesterday)
  if (!isEqual(lastLoginDate, today) && currentStreak === 1 && differenceInDays(today, lastLoginDate) === 1) {
      // This logic means if they logged in *only* yesterday, the current streak is 1.
      // If they didn't log in today, it should be 0.
      // The `recordUserLogin` function's streak logic is more direct for live updates.
      // This `calculateUserLoginStreak` is a fallback or for historical recalc.
      // If today is not in login history, current streak is 0.
      const todayStr = format(today, 'yyyy-MM-dd');
      if (!uniqueLoginDates.includes(todayStr)){
          return 0;
      }
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
  
  const loginSet = new Set(uniqueLoginDates.map(dateStr => {
     try {
      const dateObj = parseISO(dateStr); // Assumes 'YYYY-MM-DD'
      if (isNaN(dateObj.getTime())) {
        return null;
      }
      return format(dateObj, 'yyyy-MM-DD');
    } catch (e) {
      return null;
    }
  }).filter(date => date !== null));


  const weeklyStatus = weekDays.map(day => {
    const dayStr = format(day, 'yyyy-MM-DD');
    return loginSet.has(dayStr);
  });

  return weeklyStatus; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}
