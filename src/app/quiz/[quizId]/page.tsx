'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuiz } from "@/contexts/QuizContext";
import { useAuth } from "@/contexts/AuthContext";
import { QuizDisplay } from "@/components/quiz/QuizDisplay";
import { QuizProgressBar } from "@/components/quiz/QuizProgressBar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckSquare, Loader2, AlertTriangle, Home, TimerIcon, HelpCircleIcon, EyeOff, ShieldAlert, Maximize, Volume2, VolumeX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { logCheatingActivity, getCheatingFlagsForQuiz } from "@/lib/firestoreUtils";
import type { ActivityType, QuizQuestion } from "@/types";
import MotionDetector from '@/components/quiz/MotionDetector';
import { useTheme } from '@/providers/ThemeProvider';
import { saveOfflineQuizAnswer } from '@/lib/utils';
import { useOfflineQuizSync } from '@/hooks/use-offline-quiz-sync';

const CHEATING_FLAG_LIMIT = 3;
const MAX_VOICE_LOAD_ATTEMPTS = 5;
const VOICE_LOAD_RETRY_DELAY = 500; // ms

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const { 
    activeQuiz, 
    isLoadingQuiz, 
    loadQuizFromStorage, 
    answerQuestion, 
    nextQuestion, 
    previousQuestion, 
    navigateToQuestion, 
    submitQuiz,
    markQuizAsStarted,
    updateActiveQuizCheatingFlags
  } = useQuiz();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { accessibility } = useTheme();
  
  const [isClient, setIsClient] = useState(false);
  const [overallTimeLeft, setOverallTimeLeft] = useState<number | null>(null);
  const [cheatingFlagsCount, setCheatingFlagsCount] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const quizPageRef = useRef<HTMLDivElement>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout>();
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const [speechError, setSpeechError] = useState<boolean>(false);
  const [waitingForSpeechClear, setWaitingForSpeechClear] = useState<boolean>(false);
  const [ttsAvailable, setTtsAvailable] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false); // Track if user has interacted
  const lastSpokenQuestionIndex = useRef<number | null>(null); // Track last spoken question
  const [webcamDenied, setWebcamDenied] = useState(false);
  const [motionWarnings, setMotionWarnings] = useState(0);

  // Get current question early
  const currentQ = activeQuiz?.questions[activeQuiz.currentQuestionIndex];
  const perQuestionDuration = activeQuiz?.perQuestionTimeSeconds || 0;

  // Helper: check if voices are loaded
  const voicesLoaded = voices && voices.length > 0;

  // Speak utterance function (defined before speakText)
  const speakUtterance = useCallback((text: string) => {
      if (!speechSynthesis || !isClient) return;
      // Only allow if user has interacted
      if (!userInteracted) {
        toast({
          title: "Text-to-Speech Blocked",
          description: "Please click or press any key on the page before enabling text-to-speech. Chrome requires user interaction.",
          variant: "destructive",
          duration: 5000
        });
        return;
      }
      try {
          // Create new utterance
          const utterance = new SpeechSynthesisUtterance();
          utterance.text = text;
          utterance.rate = 1.0; // Normal rate
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          // Get voices (ensure voices are loaded)
          const voices = speechSynthesis.getVoices();
          if (voices.length === 0) {
              toast({
                title: "Text-to-Speech Not Ready",
                description: "Voices are not loaded yet. Please try again in a moment or reload the page.",
                variant: "destructive",
                duration: 5000
              });
              setSpeechError(true); // Mark error if no voices
              setIsSpeaking(false);
              setWaitingForSpeechClear(false); // Clear waiting state
              return;
          }

          console.log('Current voices (in speakUtterance):', voices.length);

          // Try to find a good English voice
          const englishVoice = voices.find(voice => 
            voice.lang.includes('en') && voice.name.includes('Google')
          ) || voices.find(voice => 
            voice.lang.includes('en')
          ) || voices[0];

          if (englishVoice) {
            console.log('Using voice (in speakUtterance):', englishVoice.name);
            utterance.voice = englishVoice;
          } else {
            console.warn('No suitable voice found (in speakUtterance), using default.');
          }

          // Set up event handlers
          utterance.onstart = () => {
            console.log('Started speaking:', text);
            setIsSpeaking(true);
            setSpeechError(false); // Clear error on successful start
            setWaitingForSpeechClear(false); // Clear waiting state on start
          };

          utterance.onend = () => {
            console.log('Finished speaking');
            setIsSpeaking(false);
            setWaitingForSpeechClear(false); // Clear waiting state on end
          };

          utterance.onerror = (event) => {
            // Suppress error in devtools, optionally log as warning
            // console.warn('Speech synthesis error (in speakUtterance):', event);
            setIsSpeaking(false);
            setSpeechError(true); // Mark that a speech error occurred
            setWaitingForSpeechClear(false); // Clear waiting state on error
          };

          // Speak
          speechSynthesis.speak(utterance);

      } catch (error) {
          console.error('Error in speakUtterance:', error);
          setIsSpeaking(false);
          setSpeechError(true); // Mark that a speech error occurred
          setWaitingForSpeechClear(false); // Clear waiting state on error
      }
  }, [speechSynthesis, isClient, setIsSpeaking, setSpeechError, setWaitingForSpeechClear, userInteracted]); // Added setIsSpeaking, setSpeechError, setWaitingForSpeechClear to deps

  // Improved voice loading with retry
  const loadVoicesWithRetry = useCallback((attempt = 1) => {
    if (!speechSynthesis) return;
    const voices = speechSynthesis.getVoices();
    setVoices(voices);
    if (voices.length === 0 && attempt < MAX_VOICE_LOAD_ATTEMPTS) {
      setTimeout(() => loadVoicesWithRetry(attempt + 1), VOICE_LOAD_RETRY_DELAY);
    } else if (voices.length === 0) {
      setTtsAvailable(false);
      setSpeechError(true);
      toast({
        title: "Text-to-Speech Not Available",
        description: "No voices found. Please check your browser settings or try reloading the page.",
        variant: "destructive",
        duration: 5000
      });
    } else {
      setTtsAvailable(true);
    }
  }, [speechSynthesis, toast]);

  // Initialize client-side state and speech synthesis
  useEffect(() => {
    setIsClient(true);
    if (typeof document !== 'undefined') {
      setIsFullScreen(!!document.fullscreenElement);
    }
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);
      // Chrome loads voices asynchronously
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = () => loadVoicesWithRetry();
      }
      loadVoicesWithRetry();
    } else {
      setTtsAvailable(false);
      setSpeechError(true);
      toast({
        title: "Text-to-Speech Not Supported",
        description: "Your browser does not support text-to-speech.",
        variant: "destructive",
        duration: 5000
      });
    }
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (speechSynthesis && (speechSynthesis.speaking || speechSynthesis.paused)) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
        setWaitingForSpeechClear(false);
      }
    };
  }, [speechSynthesis, loadVoicesWithRetry, toast]);

  const speakText = useCallback((text: string) => {
    if (!speechSynthesis || !isClient || waitingForSpeechClear) {
      console.warn('Speech synthesis not supported, not initialized, or waiting to clear.');
      return;
    }

    // Clear any previous error state before attempting to speak
    setSpeechError(false);

    try {
      // Debug: Log speech attempt
      console.log('Attempting to speak:', text);

      // Stop any ongoing speech if busy
      if (speechSynthesis.speaking || speechSynthesis.paused) {
          speechSynthesis.cancel();
          console.log('Cancelled ongoing speech, setting waiting state.');
          setWaitingForSpeechClear(true); // Set waiting state
          // Rely on useEffect or next user action to re-initiate speaking
          return; 
      }

      // If not busy, proceed to speak
      speakUtterance(text);

    } catch (error) {
      console.error('Error in speakText wrapper:', error);
      setIsSpeaking(false);
      setSpeechError(true); // Mark that a speech error occurred
      setWaitingForSpeechClear(false); // Clear waiting state on error
    }
  }, [speechSynthesis, isClient, waitingForSpeechClear, setIsSpeaking, setSpeechError, speakUtterance]); // Added waitingForSpeechClear and setSpeechError to deps

  const stopSpeaking = useCallback(() => {
    if (speechSynthesis) {
      try {
        if (speechSynthesis.speaking || speechSynthesis.paused) {
           speechSynthesis.cancel();
           console.log('Manually stopped speaking, clearing state.');
        }
        setIsSpeaking(false);
        setWaitingForSpeechClear(false); // Clear waiting state on manual stop
        console.log('Stopped speaking.');
      } catch (error) {
        console.error('Error stopping speech:', error);
      }
    }
    setSpeechError(false); // Clear error on explicit stop
  }, [speechSynthesis, setIsSpeaking, setSpeechError, setWaitingForSpeechClear]); // Added setIsSpeaking, setSpeechError, setWaitingForSpeechClear to deps

  // Toggle text-to-speech with F+J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      pressedKeysRef.current.add(e.key.toLowerCase());
      
      if (pressedKeysRef.current.has('f') && pressedKeysRef.current.has('j')) {
        e.preventDefault();
        const newState = !accessibility.textToSpeech;
        // setIsTextToSpeechEnabled(newState);
        
        if (!newState) {
          stopSpeaking();
          toast({
            title: "Text-to-Speech Disabled",
            description: "Press F+J to enable again.",
            duration: 3000
          });
        } else {
          toast({
            title: "Text-to-Speech Enabled",
            description: "Press F+J to disable.",
            duration: 3000
          });
          // Immediately attempt to speak the current question upon enabling via shortcut
          if (activeQuiz && activeQuiz.questions[activeQuiz.currentQuestionIndex]) {
            const currentQ = activeQuiz.questions[activeQuiz.currentQuestionIndex];
             const questionText = currentQ.question;
              const optionsText = currentQ.options
                ?.map((opt, index) => `Option ${index + 1}: ${opt}`)
                .join('. ');
              // Only attempt to speak if not currently speaking or waiting to clear
              if (!isSpeaking && !waitingForSpeechClear) {
                 speakText(`${questionText}. ${optionsText || ''}`);
              }
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [accessibility.textToSpeech, stopSpeaking, toast, activeQuiz, speakText, isSpeaking, waitingForSpeechClear]); // Added isSpeaking and waitingForSpeechClear to deps

  // Auto-read current question when it changes or when quiz loads
  useEffect(() => {
    setSpeechError(false);
    setWaitingForSpeechClear(false);

    // Only auto-speak if user has interacted and TTS is enabled
    if (!isClient || !activeQuiz || !speechSynthesis || speechError || !userInteracted || !accessibility.textToSpeech) return;

    const currentIndex = activeQuiz.currentQuestionIndex;
    const currentQ = activeQuiz.questions[currentIndex];
    if (
      currentQ && voicesLoaded &&
      lastSpokenQuestionIndex.current !== currentIndex
    ) {
      lastSpokenQuestionIndex.current = currentIndex;
      const questionText = currentQ.question;
      const optionsText = currentQ.options
        ?.map((opt, index) => `Option ${index + 1}: ${opt}`)
        .join('. ');
      const fullText = `${questionText}. ${optionsText || ''}`;
      
      // Cancel any ongoing speech before starting new
      if (speechSynthesis.speaking || speechSynthesis.paused) {
        speechSynthesis.cancel();
      }
      // Add a small delay to allow UI/voices to settle
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      speechTimeoutRef.current = setTimeout(() => {
        try {
           speakText(fullText);
        } catch (err) {
          toast({
            title: "Text-to-Speech Error",
            description: "Could not read the question. Please check your browser settings or try again.",
            variant: "destructive",
            duration: 5000
          });
        }
      }, 500);
    } else if (!voicesLoaded && accessibility.textToSpeech) {
      toast({
        title: "Text-to-Speech Not Ready",
        description: "Voices are not loaded yet. Please try again in a moment or reload the page.",
        variant: "destructive",
        duration: 5000
      });
    }

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      // Only cancel speech if the question index changes, not on every re-render
      // (No need to cancel here unless unmounting or navigating away)
    };
  }, [activeQuiz?.currentQuestionIndex, accessibility.textToSpeech, speakText, isClient, activeQuiz, speechSynthesis, speechError, userInteracted, voicesLoaded, toast]);

  // Handle cheating flags update
  const incrementAndLogCheatingFlag = useCallback(async (activityType: ActivityType, details?: string) => {
    if (!currentUser || !activeQuiz || activeQuiz.completedAt) return;

    console.warn(`Anti-cheating: ${activityType} detected.`);
    await logCheatingActivity(currentUser.uid, activeQuiz.id, activityType, details);
    
    const newCount = cheatingFlagsCount + 1;
    setCheatingFlagsCount(newCount);
    updateActiveQuizCheatingFlags(newCount);
    
    toast({
      title: "Suspicious Activity Detected",
      description: `Warning: ${activityType.replace('_', ' ')}. Further suspicious activity may lead to quiz termination. Flags: ${newCount}/${CHEATING_FLAG_LIMIT}`,
      variant: "destructive",
      duration: 7000,
    });
  }, [currentUser, activeQuiz, cheatingFlagsCount, updateActiveQuizCheatingFlags, toast]);

  useEffect(() => {
    if (isClient && quizId) {
      const loadedQuiz = loadQuizFromStorage(quizId);
      if (loadedQuiz && loadedQuiz.cheatingFlags) {
        setCheatingFlagsCount(loadedQuiz.cheatingFlags);
      }
    }
  }, [isClient, quizId, loadQuizFromStorage]);

  // Fullscreen Management
  const requestFullScreen = useCallback(() => {
    if (quizPageRef.current && !document.fullscreenElement) {
      quizPageRef.current.requestFullscreen().catch(err => {
        toast({
          title: "Fullscreen Recommended",
          description: "For the best experience and to prevent interruptions, please enable fullscreen mode.",
          variant: "default"
        });
        console.error("Error attempting to enable full-screen mode:", err);
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!isClient || !activeQuiz || activeQuiz.completedAt) return;

    const handleFullscreenChange = () => {
      const currentlyFullscreen = !!document.fullscreenElement;
      // No longer count exiting fullscreen as cheating or show a warning
      setIsFullScreen(currentlyFullscreen);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        incrementAndLogCheatingFlag('tab_switch');
      }
    };

    const handleCopyPaste = (event: ClipboardEvent) => {
      incrementAndLogCheatingFlag(event.type as ActivityType);
      event.preventDefault();
      toast({ title: "Action Disabled", description: `${event.type} is disabled during the quiz.`, variant: "destructive" });
    };
    
    const handleContextMenu = (event: MouseEvent) => {
        incrementAndLogCheatingFlag('context_menu');
        event.preventDefault();
        toast({ title: "Action Disabled", description: "Right-click is disabled during the quiz.", variant: "destructive" });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('contextmenu', handleContextMenu);

    // Attempt to enter fullscreen when quiz loads
    // requestFullScreen(); // Consider if this should be manually triggered by user action instead

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isClient, activeQuiz, incrementAndLogCheatingFlag, isFullScreen, requestFullScreen, toast]);
  
  // Check cheating flags threshold
  useEffect(() => {
    if (cheatingFlagsCount >= CHEATING_FLAG_LIMIT && activeQuiz && !activeQuiz.completedAt) {
      toast({
        title: "Quiz Terminated",
        description: "Your quiz has been terminated due to excessive suspicious activities.",
        variant: "destructive",
        duration: 10000,
      });
      submitQuiz("cheating");
    }
  }, [cheatingFlagsCount, activeQuiz, submitQuiz, toast]);


  useEffect(() => {
    if (isClient && activeQuiz && activeQuiz.id === quizId && 
        activeQuiz.timeLimitMinutes && activeQuiz.timeLimitMinutes > 0 && 
        !activeQuiz.startedAt && !activeQuiz.completedAt) {
      markQuizAsStarted(quizId);
    }
  }, [isClient, activeQuiz, quizId, markQuizAsStarted]);


  useEffect(() => {
    if (activeQuiz && !activeQuiz.completedAt && typeof activeQuiz.timeLimitMinutes === 'number' && activeQuiz.timeLimitMinutes > 0 && activeQuiz.startedAt) {
      const now = Date.now();
      const elapsedTimeSeconds = Math.floor((now - activeQuiz.startedAt) / 1000);
      const initialRemainingSeconds = (activeQuiz.timeLimitMinutes * 60) - elapsedTimeSeconds;
      
      setOverallTimeLeft(initialRemainingSeconds > 0 ? initialRemainingSeconds : 0);
    } else {
      setOverallTimeLeft(null); 
    }
  }, [activeQuiz?.id, activeQuiz?.completedAt, activeQuiz?.timeLimitMinutes, activeQuiz?.startedAt]); 


  useEffect(() => {
    if (overallTimeLeft === null || (activeQuiz && activeQuiz.completedAt)) {
      return;
    }

    if (overallTimeLeft <= 0) {
      if (activeQuiz && !activeQuiz.completedAt) { 
        toast({ title: "Time's Up!", description: "The overall quiz time has ended.", variant: "default" });
        submitQuiz("time_up");
      }
      return;
    }

    const intervalId = setInterval(() => {
      setOverallTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [overallTimeLeft, activeQuiz, submitQuiz, toast]);


  const handleAnswer = (answer: string) => {
    if (activeQuiz && !activeQuiz.completedAt) {
      answerQuestion(activeQuiz.questions[activeQuiz.currentQuestionIndex].id, answer);
      // Save to IndexedDB if offline
      if (typeof navigator !== 'undefined' && !navigator.onLine && currentUser) {
        saveOfflineQuizAnswer(activeQuiz.id, activeQuiz.questions[activeQuiz.currentQuestionIndex].id, answer);
      }
    }
  };

  const handleSubmitQuizConfirm = () => {
    if (activeQuiz && !activeQuiz.completedAt) {
      submitQuiz("completed");
    }
  };

  useEffect(() => {
    if (activeQuiz && activeQuiz.id === quizId && activeQuiz.completedAt) {
      router.push(`/results/${activeQuiz.id}`);
    }
  }, [activeQuiz, quizId, router]);


  const handlePerQuestionTimeUp = useCallback(() => {
    if (activeQuiz && !activeQuiz.completedAt) {
       toast({ title: "Question Time Up!", description: "Moving to the next question.", variant: "default" });
      if (activeQuiz.currentQuestionIndex < activeQuiz.questions.length - 1) {
        nextQuestion();
      } else {
        if (!activeQuiz.completedAt) { // If it's the last question and per-question timer runs out
          submitQuiz("time_up"); // Submit the whole quiz as time_up
        }
      }
    }
  }, [activeQuiz, nextQuestion, submitQuiz, toast]);

  // Listen for first user interaction
  useEffect(() => {
    const setInteracted = () => setUserInteracted(true);
    window.addEventListener('click', setInteracted, { once: true });
    window.addEventListener('keydown', setInteracted, { once: true });
    return () => {
      window.removeEventListener('click', setInteracted);
      window.removeEventListener('keydown', setInteracted);
    };
  }, []);

  // Add skipQuestion handler (for now, just go to nextQuestion)
  const skipQuestion = () => {
    if (activeQuiz && activeQuiz.currentQuestionIndex < activeQuiz.questions.length - 1) {
      nextQuestion();
    }
  };

  // MotionDetector callbacks
  const handleMotionWarning = async (warningCount: number) => {
    setMotionWarnings(warningCount);
    if (currentUser && activeQuiz && !activeQuiz.completedAt) {
      await incrementAndLogCheatingFlag('motion_detected', `Motion detected by webcam. Warning ${warningCount}`);
    }
  };
  const handleMaxMotionWarnings = () => {
    if (!activeQuiz?.completedAt) {
      submitQuiz('cheating');
      toast({
        title: 'Quiz Terminated',
        description: 'Quiz auto-submitted due to repeated motion detected by webcam.',
        variant: 'destructive',
        duration: 7000,
      });
    }
  };
  const handleWebcamDenied = () => {
    setWebcamDenied(true);
  };

  // Prevent screenshot attempts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Block PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        toast({
          title: 'Screenshot Blocked',
          description: 'Screenshots are not allowed during the quiz.',
          variant: 'destructive',
        });
        return false;
      }
      // Block Ctrl+Shift+S (Windows snip), Cmd+Shift+4 (Mac), etc.
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') ||
          (e.metaKey && e.shiftKey && e.key === '4')) {
        e.preventDefault();
        toast({
          title: 'Screenshot Blocked',
          description: 'Screenshots are not allowed during the quiz.',
          variant: 'destructive',
        });
        return false;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  useOfflineQuizSync(currentUser?.uid);

  if (!isClient || isLoadingQuiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading your quiz...</p>
      </div>
    );
  }

  if (!activeQuiz || activeQuiz.id !== quizId) {
    return (
      <Card className="max-w-lg mx-auto text-center shadow-lg">
        <CardHeader>
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle className="text-2xl">Quiz Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base mb-6">
            The quiz you are looking for could not be found. Try refreshing or starting a new quiz.
          </CardDescription>
          <Button asChild>
            <Link href="/create-quiz">
              <Home className="mr-2 h-4 w-4" /> Create a New Quiz
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const formatOverallTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };


  return (
    <div
      ref={quizPageRef}
      className={`space-y-6 max-w-6xl mx-auto mindmash-quiz-area max-h-screen ${isFullScreen ? 'lg:overflow-hidden' : 'overflow-y-auto'}`}
    >
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1 shadow-md">
        <span className={navigator.onLine ? 'h-3 w-3 rounded-full bg-green-500 inline-block' : 'h-3 w-3 rounded-full bg-red-500 inline-block'}></span>
        <span className="text-xs font-semibold text-muted-foreground">
          {navigator.onLine ? 'Online' : 'Offline'}
        </span>
      </div>
      {/* MotionDetector for proctoring */}
      {!activeQuiz?.completedAt && (
        <MotionDetector
          onPermissionDenied={handleWebcamDenied}
          onMotionWarning={handleMotionWarning}
          onMaxWarnings={handleMaxMotionWarnings}
          cheatingLog={{}}
          showPreview={true}
        />
      )}
      {/* Block UI if webcam denied */}
      {webcamDenied && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white">
          <ShieldAlert className="h-12 w-12 mb-4 text-red-500 animate-pulse" />
          <h2 className="text-2xl font-bold mb-2">Webcam Access Required</h2>
          <p className="mb-4">You must allow webcam access to take this proctored quiz. Please refresh and allow access, or contact support if you believe this is an error.</p>
          <Button onClick={() => router.push('/')} className="mt-2">Back to Home</Button>
        </div>
      )}
      <Card className="shadow-md bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{activeQuiz.topic} Quiz</CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            Difficulty: <span className="capitalize font-semibold text-primary">{activeQuiz.difficulty}</span>
            {activeQuiz.subtopic && (<> | Subtopic: <span className="capitalize font-semibold text-primary">{activeQuiz.subtopic}</span></>)}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3 space-y-6">
          {currentQ && (
            <Card className="shadow-lg bg-green-500/10 border-green-500">
              <CardContent className="p-0">
                <QuizDisplay
                  question={currentQ}
                  questionNumber={activeQuiz.currentQuestionIndex + 1}
                  totalQuestions={activeQuiz.questions.length}
                  onAnswer={handleAnswer}
                  isSubmitted={!!activeQuiz.completedAt}
                  showFeedback={false}
                  perQuestionDuration={perQuestionDuration}
                  onPerQuestionTimeUp={handlePerQuestionTimeUp}
                  timerKey={`per-q-${currentQ?.id}-${activeQuiz.currentQuestionIndex}`}
                  speakQuestion={() => {
                    if (currentQ) {
                      const questionText = currentQ.question;
                      const optionsText = currentQ.options
                        ?.map((opt, index) => `Option ${index + 1}: ${opt}`)
                        .join('. ');
                      speakText(`${questionText}. ${optionsText || ''}`);
                    }
                  }}
                  isSpeaking={isSpeaking}
                  isTextToSpeechEnabled={accessibility.textToSpeech}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:w-1/3 space-y-6 p-4 border rounded-lg shadow-md bg-blue-500/10 border-blue-500">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Quiz Status</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const newState = !accessibility.textToSpeech;
                    // setIsTextToSpeechEnabled(newState);
                    if (!newState) {
                      stopSpeaking();
                      toast({
                        title: "Text-to-Speech Disabled",
                        description: "Press F+J to enable again.",
                        duration: 3000
                      });
                    } else {
                      toast({
                        title: "Text-to-Speech Enabled",
                        description: "Press F+J to disable.",
                        duration: 3000
                      });
                      if (activeQuiz) {
                        const currentQ = activeQuiz.questions[activeQuiz.currentQuestionIndex];
                        if (currentQ) {
                          const questionText = currentQ.question;
                          const optionsText = currentQ.options
                            ?.map((opt, index) => `Option ${index + 1}: ${opt}`)
                            .join('. ');
                          speakText(`${questionText}. ${optionsText || ''}`);
                        }
                      }
                    }
                  }}
                  variant="outline"
                  size="sm"
                  title="Toggle Text-to-Speech"
                  className="flex items-center gap-2"
                >
                  {accessibility.textToSpeech ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">TTS</span>
                </Button>
                {!isFullScreen && (
                  <Button onClick={requestFullScreen} variant="outline" size="sm" title="Enter Fullscreen">
                    <Maximize className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center text-muted-foreground"><HelpCircleIcon className="h-4 w-4 mr-2 text-primary" /> Question:</span>
                <span className="font-semibold text-foreground">{activeQuiz.currentQuestionIndex + 1} / {activeQuiz.questions.length}</span>
              </div>
              
              {(activeQuiz.timeLimitMinutes !== undefined && activeQuiz.timeLimitMinutes > 0 && overallTimeLeft !== null && activeQuiz.startedAt) && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground"><TimerIcon className="h-4 w-4 mr-2 text-primary" /> Overall Time Left:</span>
                  <span className={`font-semibold ${overallTimeLeft <= 60 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>{formatOverallTime(overallTimeLeft)}</span>
                </div>
              )}
              {(activeQuiz.timeLimitMinutes === undefined || activeQuiz.timeLimitMinutes <= 0) && (!activeQuiz.startedAt || overallTimeLeft === null) && (
                 <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground"><TimerIcon className="h-4 w-4 mr-2 text-primary" /> Overall Time:</span>
                  <span className="font-semibold text-foreground">No Limit</span>
                </div>
              )}
               <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground"><ShieldAlert className="h-4 w-4 mr-2 text-destructive" /> Cheating Flags:</span>
                  <span className={`font-semibold ${cheatingFlagsCount > 0 ? 'text-destructive' : 'text-foreground'}`}>{cheatingFlagsCount} / {CHEATING_FLAG_LIMIT}</span>
                </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center text-muted-foreground"><Volume2 className="h-4 w-4 mr-2 text-primary" /> Text-to-Speech:</span>
                <span className="font-semibold text-foreground">
                  {accessibility.textToSpeech ? 'Enabled' : 'Disabled'} (F+J)
                </span>
              </div>
            </CardContent>
          </Card>
          
           {activeQuiz.completedAt && (
             <div className="text-center text-green-600 font-semibold p-4 border-green-500 bg-green-500/10 rounded-lg shadow">
                Quiz {activeQuiz.quizTerminationReason === "cheating" ? "Terminated" : "Completed"}!
                {activeQuiz.quizTerminationReason === "cheating" && " (Due to suspicious activity)"}
                {activeQuiz.quizTerminationReason === "time_up" && " (Time ran out)"}
             </div>
           )}
          
          <QuizProgressBar
            questions={activeQuiz.questions}
            currentQuestionIndex={activeQuiz.currentQuestionIndex}
            onNavigate={navigateToQuestion}
            isSubmittedView={!!activeQuiz.completedAt}
          />

          {/* Updated Navigation Buttons Section with sharper corners and clearer text */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={previousQuestion}
                disabled={activeQuiz.currentQuestionIndex === 0 || !!activeQuiz.completedAt}
                className={`flex items-center px-6 py-2 rounded-md font-extrabold text-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${activeQuiz.currentQuestionIndex === 0 || !!activeQuiz.completedAt ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-500 focus:text-blue-500'}
                  bg-transparent border-none text-blue-500 drop-shadow-[0_0_6px_rgba(37,99,235,0.7)]`}
                style={{ letterSpacing: '0.04em' }}
              >
                <ChevronLeft className="mr-2 h-6 w-6 font-extrabold" style={{ color: '#2563eb' }} />
                <span className="font-extrabold" style={{ color: '#2563eb', textShadow: '0 0 8px #2563eb' }}>PREV</span>
              </button>

              {activeQuiz.currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                <button
                  onClick={() => {
                    nextQuestion();
                    setTimeout(() => {
                      const nextIndex = activeQuiz.currentQuestionIndex + 1;
                      const nextQ = activeQuiz.questions[nextIndex];
                      if (
                        nextQ && accessibility.textToSpeech && voicesLoaded && userInteracted
                      ) {
                        const questionText = nextQ.question;
                        const optionsText = nextQ.options
                          ?.map((opt, index) => `Option ${index + 1}: ${opt}`)
                          .join('. ');
                        speakText(`${questionText}. ${optionsText || ''}`);
                      }
                    }, 300);
                  }}
                  disabled={!!activeQuiz.completedAt || !currentQ?.userAnswer}
                  className={`flex items-center px-6 py-2 rounded-md font-extrabold text-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${!!activeQuiz.completedAt || !currentQ?.userAnswer ? 'opacity-50 cursor-not-allowed' : 'hover:text-green-500 focus:text-green-500'}
                    bg-transparent border-none text-green-500 drop-shadow-[0_0_6px_rgba(34,197,94,0.7)] ml-2`}
                  style={{ letterSpacing: '0.04em' }}
                >
                  <span className="font-extrabold" style={{ color: '#22c55e', textShadow: '0 0 8px #22c55e' }}>NEXT</span>
                  <ChevronRight className="ml-2 h-6 w-6 font-extrabold" style={{ color: '#22c55e' }} />
                </button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      disabled={!!activeQuiz.completedAt || !currentQ?.userAnswer}
                      className={`flex items-center px-6 py-2 rounded-md font-extrabold text-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${!!activeQuiz.completedAt || !currentQ?.userAnswer ? 'opacity-50 cursor-not-allowed' : 'hover:text-green-500 focus:text-green-500'}
                        bg-transparent border-none text-green-500 drop-shadow-[0_0_6px_rgba(34,197,94,0.7)] ml-2`}
                      style={{ letterSpacing: '0.04em' }}
                    >
                      <span className="font-extrabold" style={{ color: '#22c55e', textShadow: '0 0 8px #22c55e' }}>SUBMIT</span>
                      <CheckSquare className="ml-2 h-6 w-6 font-extrabold" style={{ color: '#22c55e' }} />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ready to submit your answers?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Once submitted, you won't be able to change your answers.
                        The quiz will also auto-submit if the overall timer runs out or suspicious activity is detected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Review Answers</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSubmitQuizConfirm} className="bg-green-600 hover:bg-green-700">
                        Yes, Submit Quiz
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            {/* Skip Button below navigation */}
            <button
              onClick={() => {
                skipQuestion();
                setTimeout(() => {
                  const nextIndex = activeQuiz.currentQuestionIndex + 1;
                  const nextQ = activeQuiz.questions[nextIndex];
                  if (
                    nextQ && accessibility.textToSpeech && voicesLoaded && userInteracted
                  ) {
                    const questionText = nextQ.question;
                    const optionsText = nextQ.options
                      ?.map((opt, index) => `Option ${index + 1}: ${opt}`)
                      .join('. ');
                    speakText(`${questionText}. ${optionsText || ''}`);
                  }
                }, 300);
              }}
              disabled={!!activeQuiz.completedAt}
              className={`mt-2 flex items-center justify-center px-6 py-2 rounded-md font-extrabold text-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${!!activeQuiz.completedAt ? 'opacity-50 cursor-not-allowed' : 'hover:text-purple-500 focus:text-purple-500'}
                bg-transparent border-none text-purple-500 drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]`}
              style={{ letterSpacing: '0.04em' }}
            >
              <span className="font-extrabold" style={{ color: '#a855f7', textShadow: '0 0 8px #a855f7' }}>SKIP</span>
            </button>
          </div>
        </div>
      </div>

      {/* TTS Help Message */}
      {!ttsAvailable && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Text-to-Speech is not available.</strong><br />
          Please ensure your browser supports speech synthesis and that voices are enabled. Try reloading the page or using a different browser (Chrome/Edge/Firefox recommended).
        </div>
      )}

      {/* Exit Fullscreen button (show only when in fullscreen) */}
      {isFullScreen && (
        <button
          onClick={() => {
            if (document.exitFullscreen) document.exitFullscreen();
          }}
          className="fixed top-4 right-4 z-50 bg-card border border-border rounded-full p-2 shadow-lg flex items-center justify-center hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          title="Exit Fullscreen"
          aria-label="Exit Fullscreen"
        >
          {/* Use Minimize icon from Lucide or fallback */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 14h6v6M20 10h-6V4" /></svg>
          <span className="sr-only">Exit Fullscreen</span>
        </button>
      )}
    </div>
  );
}
