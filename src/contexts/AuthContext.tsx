
"use client";

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  type User as FirebaseUser,
  type AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createUserProfileDocument, getUserProfile, recordUserLogin } from '@/lib/firestoreUtils'; // Added recordUserLogin

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signup: (email: string, pass: string) => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
  // Add other providers like Google, GitHub, etc. here if needed
  // loginWithGoogle: () => Promise<FirebaseUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Check if user profile exists, if not, redirect to /profile
        const profile = await getUserProfile(user.uid);
        // Profile creation is handled during signup. Here we check if mandatory fields are missing.
        if (!profile || !profile.displayName || !profile.birthdate || !profile.bio) {
            if (window.location.pathname !== '/profile') {
                 toast({
                    title: "Complete Your Profile",
                    description: "Please fill in all required profile details to continue.",
                    variant: "default", // or "destructive" if it's a strict requirement
                    duration: 7000,
                 });
                router.push('/profile?incomplete=true');
            }
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast]); // Added router and toast to dependency array

  const handleAuthError = (error: AuthError, defaultMessage: string) => {
    console.error("Firebase Auth Error:", error);
    let message = defaultMessage;
    if (error.code) {
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
        default:
          message = error.message || defaultMessage;
      }
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
      await recordUserLogin(userCredential.user.uid); // Record login
      toast({ title: 'Logged In', description: 'Successfully logged in!' });
      
      const profile = await getUserProfile(userCredential.user.uid);
      if (!profile || !profile.displayName || !profile.birthdate || !profile.bio) {
         toast({
            title: "Profile Incomplete",
            description: "Please complete your profile information.",
            duration: 5000,
          });
        router.push('/profile?incomplete=true');
      } else {
        router.push('/dashboard'); 
      }
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
      setCurrentUser(userCredential.user);
      // Create a basic profile document, actual completion will be on /profile page
      await createUserProfileDocument(userCredential.user.uid, {
        email: userCredential.user.email || undefined,
        displayName: userCredential.user.displayName || email.split('@')[0], // default display name
        // bio and birthdate will be empty, forcing user to /profile
        bio: '', 
        birthdate: '', 
      });
      await recordUserLogin(userCredential.user.uid); // Record first login/signup
      toast({ title: 'Account Created', description: 'Successfully signed up! Please complete your profile.' });
      router.push('/profile?new_user=true'); // Redirect to profile page for completion
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError, 'Failed to sign up.');
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
