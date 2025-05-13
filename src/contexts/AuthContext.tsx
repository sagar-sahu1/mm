
"use client";

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup, // Import for Google Sign-In
  type User as FirebaseUser,
  type AuthError
} from 'firebase/auth';
import { auth, GoogleAuthProvider } from '@/lib/firebase'; // Import GoogleAuthProvider
import { useRouter, useSearchParams } from 'next/navigation'; 
import { useToast } from '@/hooks/use-toast';
import { createUserProfileDocument, getUserProfile, recordUserLogin } from '@/lib/firestoreUtils';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signup: (email: string, pass: string) => Promise<FirebaseUser | null>;
  loginWithGoogle: () => Promise<FirebaseUser | null>; // Add Google login method
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []); 

  const handleAuthError = (error: AuthError | Error, defaultMessage: string) => {
    console.error("Firebase Auth Error:", error);
    let message = defaultMessage;
    if ('code' in error) { // Check if it's an AuthError
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
    } else { // Generic error
        message = error.message || defaultMessage;
    }
    toast({
      title: 'Authentication Error',
      description: message,
      variant: 'destructive',
    });
    return null;
  }

  const login = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setCurrentUser(userCredential.user);
      await recordUserLogin(userCredential.user.uid); 
      toast({ title: 'Logged In', description: 'Successfully logged in!' });
      
      const redirectUrl = searchParams.get('redirect') || '/dashboard'; 
      router.push(redirectUrl); 
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
      setCurrentUser(user);
      
      await createUserProfileDocument(user.uid, {
        email: user.email || undefined,
        displayName: user.displayName || email.split('@')[0],
      });
      
      toast({ title: 'Account Created', description: 'Welcome to MindMash! Consider completing your profile.' });
      
      const userProfile = await getUserProfile(user.uid);
      const isProfileComplete = userProfile?.displayName && userProfile?.birthdate && userProfile.bio;

      if (!isProfileComplete) {
        router.push(`/profile?redirect=${searchParams.get('redirect') || '/dashboard'}`);
      } else {
        const redirectUrl = searchParams.get('redirect') || '/dashboard';
        router.push(redirectUrl);
      }
      return user;
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
      setCurrentUser(user);

      // Check if user profile exists, if not create it
      const userProfile = await getUserProfile(user.uid);
      if (!userProfile) {
        await createUserProfileDocument(user.uid, {
          email: user.email || undefined,
          displayName: user.displayName || user.email?.split('@')[0],
          photoURL: user.photoURL || undefined,
        });
      }
      await recordUserLogin(user.uid);

      toast({ title: 'Logged In with Google', description: 'Successfully logged in!' });
      
      const isNewUserOrProfileIncomplete = !userProfile || !userProfile.displayName || !userProfile.birthdate || !userProfile.bio;

      if (isNewUserOrProfileIncomplete) {
        router.push(`/profile?redirect=${searchParams.get('redirect') || '/dashboard'}`);
      } else {
        const redirectUrl = searchParams.get('redirect') || '/dashboard';
        router.push(redirectUrl);
      }
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
