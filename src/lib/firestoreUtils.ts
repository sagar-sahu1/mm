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
  challengeDetails: Omit<ChallengeData, 'createdAt' | 'slug' | 'questions'> & { questions: QuizQuestion[] },
  slug: string
): Promise<void> {
  const db = getDb();
  const challengeRef = doc(db, 'challenges', slug);
  
  // Base structure for ChallengeData excluding optional fields initially
  const dataToSet: Omit<ChallengeData, 'createdAt' | 'slug'> & { slug: string; createdAt: Timestamp } = {
    topic: challengeDetails.topic,
    difficulty: challengeDetails.difficulty,
    numberOfQuestions: challengeDetails.numberOfQuestions,
    questions: challengeDetails.questions,
    challengerUid: challengeDetails.challengerUid,
    slug: slug, // ensure slug is part of the data being set
    createdAt: serverTimestamp() as Timestamp, // Firestore will set this on the server
    // Explicitly include all expected fields, defaulting if necessary or omitting if truly optional
    subtopic: challengeDetails.subtopic || undefined,
    timeLimit: challengeDetails.timeLimit !== undefined ? challengeDetails.timeLimit : undefined,
    additionalInstructions: challengeDetails.additionalInstructions || undefined,
    challengerName: challengeDetails.challengerName || undefined,
    isPublic: challengeDetails.isPublic || false, // Default to false if not provided
  };

  // Remove undefined fields from dataToSet
  Object.keys(dataToSet).forEach(key => {
    if (dataToSet[key] === undefined) {
      delete dataToSet[key];
    }
  });
  await setDoc(challengeRef, dataToSet);
}

export async function getChallengeBySlug(slug: string): Promise<ChallengeData | null> {
  const db = getDb();
  const challengeRef = doc(db, 'challenges', slug);
  const challengeSnap = await getDoc(challengeRef);

  if (challengeSnap.exists()) {
    const data = challengeSnap.data();
    // Ensure all fields from ChallengeData are mapped, even if they might be undefined in Firestore
    return {
        slug: data.slug, // slug is part of the document ID, but also stored in the document
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
    orderBy('__name__', 'asc'), // Use document ID for tie-breaking
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
        loginHistory.sort(); // Keep it sorted for easier processing if needed, though Set handles uniqueness
      }

      const currentStreak = userData.currentStreak || 0;
      const lastStreakLogin = userData.lastStreakLoginDate;

      if (lastStreakLogin) {
        const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
        if (lastStreakLogin === yesterdayStr) {
          newStreak = currentStreak + 1;
        } else if (lastStreakLogin === todayStr) {
          newStreak = currentStreak; // Already logged in today, streak doesn't change
        } else {
          newStreak = 1; // Streak broken
        }
      } else {
        newStreak = 1; // First login or first login after a long time
      }
    } else {
      // This case should ideally not happen if createUserProfileDocument is called on signup.
      // However, as a fallback or for users created before this logic:
      console.warn(`User document for UID ${uid} not found during login recording. Creating one if auth user exists.`);
      // To prevent errors, we might try to create a minimal profile here or log an error
      // For now, we'll assume profile exists or is created at signup.
      // If you want to create it here, you'd need access to the auth user object.
      const auth = (await import('@/lib/firebase')).auth; // Dynamically import to avoid circular deps if any
      const currentUserForFallback = auth.currentUser;
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
          // Default other fields as in createUserProfileDocument
          bio: '',
          birthdate: format(new Date(), 'yyyy-MM-dd'), // Default birthdate
        };
        await setDoc(userRef, initialData);
      }
      // Since profile was just created or is missing, this login attempt is the start of a streak
      // The logic below will handle the update.
      return; // Exit early as we've just set initial values or if user doesn't exist
    }
    
    // Limit login history size to prevent excessively large documents
    if (loginHistory.length > 550) { // Approx 1.5 years of daily logins
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
    // Ensure dates are unique and sorted, though recordUserLogin tries to maintain this.
    return [...new Set(userProfile.loginHistory)].sort(); 
  }
  return [];
}


// Updated to return UserActivityLog typed objects for consistency, though it's login history
export async function getUserLoginActivityForYear(uid: string, year: number): Promise<CheatingActivityLog[]> { 
  const userProfile = await getUserProfile(uid);
  if (!userProfile || !userProfile.loginHistory) {
    return [];
  }

  const activities: CheatingActivityLog[] = [];
  userProfile.loginHistory.forEach(dateStr => {
    try {
      const loginDate = parseISO(dateStr); // parseISO is robust for 'yyyy-MM-dd'
      if (loginDate.getFullYear() === year) {
        activities.push({
          userId: uid,
          quizId: 'login_activity', // Generic quizId for login events
          activityType: 'login' as ActivityType, // Use a generic type or cast if needed
          timestamp: Timestamp.fromDate(loginDate), // Convert Date to Firestore Timestamp
          details: `Logged in on ${dateStr}`,
        } as CheatingActivityLog); // Cast to CheatingActivityLog if 'login' is not a standard ActivityType
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
  
  // Ensure dates are Date objects, unique, and sorted
  const sortedDates = [...new Set(uniqueLoginDates.map(d => parseISO(d)))]
    .filter(d => !isNaN(d.getTime())) // Filter out invalid dates from parseISO
    .sort((a,b) => a.getTime() - b.getTime());

  if (sortedDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0,0,0,0); 

  const lastLoginDate = new Date(sortedDates[sortedDates.length - 1]);
  lastLoginDate.setHours(0,0,0,0);

  // If last login was before yesterday, streak is 0
  if (differenceInDays(today, lastLoginDate) > 1) {
    return 0; 
  }

  let currentStreak = 0;
  // Iterate backwards from the last logged date
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const currentDate = new Date(sortedDates[i]);
    currentDate.setHours(0,0,0,0);
    
    // The date we expect for a continuous streak, relative to 'today' or the next date in sequence
    const expectedDate = subDays( (i === sortedDates.length - 1) ? today : new Date(sortedDates[i+1]), 1);
    expectedDate.setHours(0,0,0,0);

    if (isEqual(currentDate, expectedDate)) {
        currentStreak++;
    } else if (i === sortedDates.length -1 && isEqual(currentDate, today)) { // Last login is today
        currentStreak++;
    } else {
      // Streak is broken if the current date doesn't match the expected previous date
      break; 
    }
  }
  
  // If the very last login date in the sorted list is today, but it wasn't part of a sequence from yesterday,
  // the streak is 1. If it was yesterday, and today is not logged, streak is 0.
  // The loop handles building the streak correctly from the latest logged dates.
  // If the latest login is today, and it's the only one, streak is 1.
  // If latest is yesterday, and no login today, streak is 0 (covered by initial check).

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
      if (isNaN(dateObj.getTime())) { // Check if date is valid after parsing
        console.warn(`Invalid date string encountered in login history: ${dateStr}`);
        return null;
      }
      return format(dateObj, 'yyyy-MM-dd');
    } catch (e) {
      console.warn(`Error parsing date string ${dateStr}:`, e);
      return null;
    }
  }).filter(date => date !== null) as Set<string>); // Ensure we have a Set of valid strings


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
    // This part assumes quizzes are stored in a 'quizzes' collection at the root
    // And that the quiz document has a 'cheatingFlags' field.
    // This might need adjustment if quizzes are stored within user documents or elsewhere.
    // For now, assuming a root 'quizzes' collection for simplicity.
    // This is also a client-side update pattern; for security/atomicity, a Firebase Function is better.
    const quizDocRef = doc(db, 'quizzes', quizId); // Assumes 'quizzes' is a top-level collection.
    const quizSnap = await getDoc(quizDocRef);
    if (quizSnap.exists()) {
      const currentFlags = (quizSnap.data() as any).cheatingFlags || 0; // Type assertion needed if Quiz type not fully known here
      await updateDoc(quizDocRef, { cheatingFlags: currentFlags + 1 });
    } else {
      console.warn(`Quiz document ${quizId} not found to update cheating flags.`);
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
    if (error instanceof Error && (error.message.includes('firestore/indexes') || ((error as any).code === 'failed-precondition' && error.message.includes('query requires an index')))) {
       console.warn("Firestore index missing for getCheatingFlagsForQuiz query. Please create the required composite index in your Firebase console. Index: 'cheating_logs' collection, where 'quizId' == ?, where 'userId' == ?, order by 'timestamp' (asc).");
    }
    return [];
  }
}


import { auth } from '@/lib/firebase'; // Ensure auth is imported if needed for fallbacks
