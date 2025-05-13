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
  refreshUser: () => Promise<void>;
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
      setCurrentUser(auth.currentUser); // Update context with the reloaded user
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
    setLoading(false); // Ensure loading is set to false on error
    return null;
  }

  const navigateAfterAuth = async (userToNavigate: FirebaseUser) => {
    // This function doesn't check for profile completion anymore,
    // as per user request to make profile completion optional.
    const redirectUrl = searchParams.get('redirect') || '/dashboard';
    router.push(redirectUrl);
  };

  const login = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setCurrentUser and recordUserLogin
      toast({ title: 'Logged In', description: 'Successfully logged in!' });
      await navigateAfterAuth(userCredential.user);
      setLoading(false);
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError, 'Failed to log in.');
    } 
    // setLoading(false) is handled by handleAuthError or success path
  };

  const signup = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      
      const initialDisplayName = user.displayName || email.split('@')[0];
      await updateFirebaseUserProfile(user, { displayName: initialDisplayName });
      
      await createUserProfileDocument(user.uid, {
        email: user.email || undefined,
        displayName: initialDisplayName,
        photoURL: user.photoURL || undefined, // Persist photoURL if Google sign-up was first (though this is email signup)
      });
      
      await user.reload(); // Reload to get updated displayName in auth object
      // onAuthStateChanged will handle setCurrentUser after reload & recordUserLogin
      
      toast({ title: 'Account Created', description: 'Welcome to MindMash!' });
      // Redirect to dashboard directly, profile completion is optional
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.push(redirectUrl);
      setLoading(false);
      return auth.currentUser; 
    } catch (error) {
      return handleAuthError(error as AuthError, 'Failed to sign up.');
    }
  };

  const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      let userProfile = await getUserProfile(user.uid);
      if (!userProfile) {
        const profileDataToCreate: Partial<UserProfileFirestoreData> = {
            email: user.email || undefined,
            displayName: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL || undefined,
            // bio, birthdate, socialLinks will default in createUserProfileDocument
        };
        await createUserProfileDocument(user.uid, profileDataToCreate);
      } else {
        const updates: Partial<UserProfileFirestoreData> = {};
        if (user.displayName && user.displayName !== userProfile.displayName) {
            updates.displayName = user.displayName;
        }
        if (user.photoURL && user.photoURL !== userProfile.photoURL) {
            updates.photoURL = user.photoURL;
        }
        if (Object.keys(updates).length > 0) {
            await updateUserProfile(user.uid, updates);
        }
      }
      
      // onAuthStateChanged handles setCurrentUser & recordUserLogin
      // Call refreshUser to ensure the context currentUser is updated from auth after any backend sync
      await refreshUser(); 

      toast({ title: 'Logged In with Google', description: 'Successfully logged in!' });
      
      if (auth.currentUser) {
        await navigateAfterAuth(auth.currentUser);
      } else {
        // Fallback, though auth.currentUser should be set by now
        await navigateAfterAuth(user);
      }
      setLoading(false);
      return auth.currentUser || user;
    } catch (error) {
      return handleAuthError(error as AuthError, 'Failed to log in with Google.');
    }
  };


  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will set currentUser to null
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

