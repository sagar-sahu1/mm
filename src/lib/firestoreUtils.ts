
import { doc, setDoc, getDoc, serverTimestamp, type Timestamp, updateDoc, collection, query, where, getDocs, limit, orderBy, addDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { QuizQuestion, QuizDifficulty, UserProfileFirestoreData, UserProfile, CheatingActivityLog, ActivityType } from '@/types';
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
        birthdate: data.birthdate || format(new Date(), 'yyyy-MM-dd'), 
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
  const q = query(
    usersRef, 
    orderBy('totalScore', 'desc'), 
    orderBy('quizzesCompleted', 'desc'), 
    orderBy('__name__', 'asc'), 
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
      console.warn("Firestore index missing for leaderboard query. Please create the required composite index in your Firebase console. Index: 'users' collection, order by 'totalScore' (desc), 'quizzesCompleted' (desc), '__name__' (asc).");
    }
    return [];
  }
}

// User Activity Log Functions
export async function recordUserLogin(uid: string): Promise<void> {
  const db = getDb();
  const userRef = doc(db, 'users', uid);
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  try {
    const userSnap = await getDoc(userRef);
    let newStreak = 1;
    let loginHistory: string[] = [];

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfileFirestoreData;
      loginHistory = userData.loginHistory || [];
      if (!loginHistory.includes(todayStr)) {
        loginHistory.push(todayStr);
        loginHistory.sort(); 
      }

      const currentStreak = userData.currentStreak || 0;
      const lastStreakLogin = userData.lastStreakLoginDate;

      if (lastStreakLogin) {
        const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
        if (lastStreakLogin === yesterdayStr) {
          newStreak = currentStreak + 1;
        } else if (lastStreakLogin === todayStr) {
          newStreak = currentStreak; 
        } else {
          newStreak = 1; 
        }
      } else {
        newStreak = 1; 
      }
    } else {
      console.warn(`User document for UID ${uid} not found during login recording. Creating one if auth user exists.`);
      const currentUserForFallback = auth.currentUser; // Ensure auth is available
      if (currentUserForFallback) {
         const initialData: Partial<UserProfileFirestoreData> = {
          email: currentUserForFallback.email || undefined,
          displayName: currentUserForFallback.displayName || currentUserForFallback.email?.split('@')[0] || 'Anonymous User',
          lastLoginAt: serverTimestamp() as Timestamp,
          loginHistory: [todayStr],
          currentStreak: 1,
          lastStreakLoginDate: todayStr,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          totalScore: 0,
          quizzesCompleted: 0,
          bio: '',
          birthdate: format(new Date(), 'yyyy-MM-dd'),
        };
        await setDoc(userRef, initialData);
      }
      return; 
    }
    
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
    return userProfile.loginHistory.sort(); 
  }
  return [];
}


export async function getUserLoginActivityForYear(uid: string, year: number): Promise<CheatingActivityLog[]> { // Changed return type
  const userProfile = await getUserProfile(uid);
  if (!userProfile || !userProfile.loginHistory) {
    return [];
  }

  const activities: CheatingActivityLog[] = []; // Changed type
  userProfile.loginHistory.forEach(dateStr => {
    try {
      const loginDate = parseISO(dateStr); 
      if (loginDate.getFullYear() === year) {
        // This function is for heatmap, it assumes each entry in loginHistory is a unique login day.
        // For the CheatingActivityLog type, activityType is mandatory.
        // This function might need renaming or refactoring if it's specifically for login heatmap
        // vs generic activity logs. For now, let's assume it's just transforming loginHistory for heatmap.
        activities.push({
          userId: uid, // Changed from uid
          quizId: 'N/A_login_activity', // Placeholder as quizId is not relevant for general login
          activityType: 'tab_switch', // Placeholder, this function is for login history, not specific cheating types
          date: dateStr,
          timestamp: Timestamp.fromDate(loginDate), 
          // count: 1, // CheatingActivityLog doesn't have count, it represents one event
        } as unknown as CheatingActivityLog); // Casting as activityType is required
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
  
  const sortedDates = [...new Set(uniqueLoginDates)].map(d => parseISO(d)).sort((a,b) => a.getTime() - b.getTime());

  if (sortedDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0,0,0,0); 

  const lastLoginDate = sortedDates[sortedDates.length - 1];
  lastLoginDate.setHours(0,0,0,0);

  if (differenceInDays(today, lastLoginDate) > 1) {
    return 0; 
  }

  let currentStreak = 0;
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const dateToCheck = new Date(sortedDates[i]);
    dateToCheck.setHours(0,0,0,0);
    
    const expectedPreviousDate = subDays( (i === sortedDates.length - 1) ? today : new Date(sortedDates[i+1]), 1);
    expectedPreviousDate.setHours(0,0,0,0);

    if (isEqual(dateToCheck, expectedPreviousDate) || (i === sortedDates.length -1 && isEqual(dateToCheck, today))) {
        currentStreak++;
    } else if (i === sortedDates.length -1 && isEqual(dateToCheck, subDays(today,1))) { 
        currentStreak++;
    }
     else {
      break; 
    }
  }
  
  const todayStr = format(today, 'yyyy-MM-dd');
  if (!uniqueLoginDates.includes(todayStr) && isEqual(lastLoginDate, subDays(today, 1)) && currentStreak === 1){
      // This case means they logged in yesterday, but not today, and yesterday was the start of a new streak.
      // So currentStreak should be 0.
      // However, if lastLoginDate is today, and uniqueLoginDates.includes(todayStr) is true, currentStreak should be at least 1.
      // The calculateUserLoginStreak logic needs to be robust for this.
      // If the last login was yesterday, and they didn't log in today, streak is 0.
      // The current logic might count yesterday as 1.
      // Let's re-evaluate: if today is not in uniqueLoginDates and lastLoginDate is yesterday, streak is 0.
      // This is already covered by the first check: `differenceInDays(today, lastLoginDate) > 1` would be false.
      // And `differenceInDays(today, lastLoginDate) === 1` means streak is 0 if today is not logged.
      // The loop correctly builds the streak from the *last logged day*.
      // If the last logged day is *not* today or yesterday, the streak is 0.
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
      const dateObj = parseISO(dateStr); 
      if (isNaN(dateObj.getTime())) {
        return null;
      }
      return format(dateObj, 'yyyy-MM-dd');
    } catch (e) {
      return null;
    }
  }).filter(date => date !== null));


  const weeklyStatus = weekDays.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return loginSet.has(dayStr);
  });

  return weeklyStatus; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}


export async function logCheatingActivity(
  userId: string,
  quizId: string,
  activityType: ActivityType,
  details?: string
): Promise<string | null> {
  const db = getDb();
  try {
    const logEntry: Omit<CheatingActivityLog, 'id'> = {
      userId,
      quizId,
      activityType,
      timestamp: serverTimestamp() as Timestamp,
      details: details || '',
    };
    const docRef = await addDoc(collection(db, 'cheating_logs'), logEntry);
    
    // Update cheatingFlags count on the quiz document
    const quizRef = doc(db, 'quizzes', quizId);
    const quizSnap = await getDoc(quizRef);
    if (quizSnap.exists()) {
      const currentFlags = quizSnap.data().cheatingFlags || 0;
      await updateDoc(quizRef, { cheatingFlags: currentFlags + 1 });
    }
    
    return docRef.id;
  } catch (error) {
    console.error("Error logging cheating activity:", error);
    return null;
  }
}

export async function getCheatingFlagsForQuiz(quizId: string, userId: string): Promise<CheatingActivityLog[]> {
  const db = getDb();
  const logsRef = collection(db, 'cheating_logs');
  const q = query(logsRef, where('quizId', '==', quizId), where('userId', '==', userId), orderBy('timestamp', 'asc'));

  try {
    const querySnapshot = await getDocs(q);
    const flags: CheatingActivityLog[] = [];
    querySnapshot.forEach((docSnap) => {
      flags.push({ id: docSnap.id, ...docSnap.data() } as CheatingActivityLog);
    });
    return flags;
  } catch (error) {
    console.error("Error fetching cheating flags:", error);
    return [];
  }
}


import { auth } from '@/lib/firebase';
