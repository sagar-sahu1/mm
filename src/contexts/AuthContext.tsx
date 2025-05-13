
"use client";

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup, 
  type User as FirebaseUser,
  type AuthError,
  updateProfile as updateFirebaseUserProfile // For updating Firebase Auth user profile
} from 'firebase/auth';
import { auth, GoogleAuthProvider } from '@/lib/firebase'; 
import { useRouter, useSearchParams } from 'next/navigation'; 
import { useToast } from '@/hooks/use-toast';
import { createUserProfileDocument, getUserProfile, recordUserLogin, updateUserProfile } from '@/lib/firestoreUtils';
import type { UserProfileFirestoreData } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signup: (email: string, pass: string) => Promise<FirebaseUser | null>;
  loginWithGoogle: () => Promise<FirebaseUser | null>; 
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>; // Added to refresh user data
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const { toast } = useToast();

  const refreshUser = async () => {
    const user = auth.currentUser;
    if (user) {
      await user.reload();
      setCurrentUser(auth.currentUser);
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await recordUserLogin(user.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []); 

  const handleAuthError = (error: AuthError | Error, defaultMessage: string) => {
    console.error("Firebase Auth Error:", error);
    let message = defaultMessage;
    if ('code' in error) { 
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          message = 'Invalid email or password.';
          break;
        case 'auth/email-already-in-use':
          message = 'This email is already in use.';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak. It should be at least 6 characters.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;
        case 'auth/popup-closed-by-user':
          message = 'Sign-in process was cancelled.';
          break;
        case 'auth/account-exists-with-different-credential':
            message = 'An account already exists with the same email address but different sign-in credentials. Try signing in using a provider associated with this email address.';
            break;
        default:
          message = error.message || defaultMessage;
      }
    } else { 
        message = error.message || defaultMessage;
    }
    toast({
      title: 'Authentication Error',
      description: message,
      variant: 'destructive',
    });
    return null;
  }

  const navigateAfterAuth = async (user: FirebaseUser) => {
    const userProfile = await getUserProfile(user.uid);
    const isProfileConsideredComplete = userProfile?.displayName && userProfile.birthdate && userProfile.bio;

    if (!isProfileConsideredComplete) {
      toast({
        title: "Complete Your Profile",
        description: "Please complete your profile to continue.",
        duration: 5000,
      });
      router.push(`/profile?redirect=${searchParams.get('redirect') || '/dashboard'}`);
    } else {
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.push(redirectUrl);
    }
  };

  const login = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setCurrentUser(userCredential.user);
      await recordUserLogin(userCredential.user.uid); 
      toast({ title: 'Logged In', description: 'Successfully logged in!' });
      
      await navigateAfterAuth(userCredential.user);
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError, 'Failed to log in.');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      
      // Update Firebase Auth user profile with displayName
      await updateFirebaseUserProfile(user, { displayName: email.split('@')[0] });
      
      // Create Firestore profile document
      await createUserProfileDocument(user.uid, {
        email: user.email || undefined,
        displayName: user.displayName || email.split('@')[0], // Use the (now updated) displayName from auth user
      });
      
      // Important: Reload user to get the updated displayName from Firebase Auth
      await user.reload();
      setCurrentUser(auth.currentUser); // Set current user from auth.currentUser after reload

      toast({ title: 'Account Created', description: 'Welcome to MindMash! Please complete your profile.' });
      
      router.push(`/profile?redirect=${searchParams.get('redirect') || '/dashboard'}`); // Always redirect to profile after signup
      return auth.currentUser; // Return the potentially updated user object
    } catch (error) {
      return handleAuthError(error as AuthError, 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setCurrentUser(user); // Set context with user from Google sign-in

      let userProfile = await getUserProfile(user.uid);
      if (!userProfile) {
        const profileDataToCreate: UserProfileFirestoreData = {
            email: user.email || undefined,
            displayName: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL || undefined,
            // Initialize other fields for new profile
            bio: '',
            birthdate: '', // Ensure birthdate is empty to trigger profile completion
            socialLinks: {},
        };
        await createUserProfileDocument(user.uid, profileDataToCreate);
        userProfile = await getUserProfile(user.uid); // Re-fetch to get the created profile
      } else {
        // If profile exists, ensure photoURL from Google is updated if it's different or missing
        if (user.photoURL && user.photoURL !== userProfile.photoURL) {
            await updateUserProfile(user.uid, { photoURL: user.photoURL });
        }
      }
      
      await recordUserLogin(user.uid);

      toast({ title: 'Logged In with Google', description: 'Successfully logged in!' });
      
      await navigateAfterAuth(user); // Use user from Google result for navigation logic
      return user;
    } catch (error) {
      return handleAuthError(error as AuthError, 'Failed to log in with Google.');
    } finally {
      setLoading(false);
    }
  };


  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
      toast({ title: 'Logged Out', description: 'Successfully logged out.' });
      router.push('/login'); 
    } catch (error) {
      console.error("Logout Error:", error);
      toast({
        title: 'Logout Error',
        description: (error as AuthError).message || 'Failed to log out.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      {loading && (
        <div className="flex justify-center items-center h-screen bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}
    </AuthContext.Provider>
  );
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
