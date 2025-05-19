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

const CHEATING_FLAG_LIMIT = 3;

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
  
  const [isClient, setIsClient] = useState(false);
  const [overallTimeLeft, setOverallTimeLeft] = useState<number | null>(null);
  const [cheatingFlagsCount, setCheatingFlagsCount] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isTextToSpeechEnabled, setIsTextToSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const quizPageRef = useRef<HTMLDivElement>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout>();
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const [speechError, setSpeechError] = useState<boolean>(false);
  const [waitingForSpeechClear, setWaitingForSpeechClear] = useState<boolean>(false);

  // Get current question early
  const currentQ = activeQuiz?.questions[activeQuiz.currentQuestionIndex];
  const perQuestionDuration = activeQuiz?.perQuestionTimeSeconds || 0;

  // Speak utterance function (defined before speakText)
  const speakUtterance = useCallback((text: string) => {
      if (!speechSynthesis || !isClient) return;

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
              console.warn('No voices available for speech synthesis. Cannot speak.');
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
            console.error('Speech synthesis error (in speakUtterance):', event);
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
  }, [speechSynthesis, isClient, setIsSpeaking, setSpeechError, setWaitingForSpeechClear]); // Added setIsSpeaking, setSpeechError, setWaitingForSpeechClear to deps

  // Initialize client-side state and speech synthesis
  useEffect(() => {
    setIsClient(true);
    if (typeof document !== 'undefined') {
      setIsFullScreen(!!document.fullscreenElement);
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      
      // Debug: Log available voices
      const logVoices = () => {
        const voices = synth.getVoices();
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      };

      // Chrome loads voices asynchronously
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = logVoices;
      }
      logVoices();

      setSpeechSynthesis(synth);
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      // Cancel any ongoing speech on unmount
      if (speechSynthesis && (speechSynthesis.speaking || speechSynthesis.paused)) {
        speechSynthesis.cancel();
        setIsSpeaking(false); // Ensure state is reset
        setWaitingForSpeechClear(false); // Reset waiting state on unmount
      }
    };
  }, [speechSynthesis]); // Added speechSynthesis to dependency array

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
        const newState = !isTextToSpeechEnabled;
        setIsTextToSpeechEnabled(newState);
        
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
  }, [isTextToSpeechEnabled, stopSpeaking, toast, activeQuiz, speakText, isSpeaking, waitingForSpeechClear]); // Added isSpeaking and waitingForSpeechClear to deps

  // Auto-read current question when it changes or when quiz loads
  useEffect(() => {
    // Reset speech error state and waiting state when question index changes
    setSpeechError(false);
    setWaitingForSpeechClear(false);

    if (!isClient || !activeQuiz || !speechSynthesis || speechError || isSpeaking || waitingForSpeechClear) return;

    const currentQ = activeQuiz.questions[activeQuiz.currentQuestionIndex];
    if (isTextToSpeechEnabled && currentQ) {
      const questionText = currentQ.question;
      const optionsText = currentQ.options
        ?.map((opt, index) => `Option ${index + 1}: ${opt}`)
        .join('. ');
      
      const fullText = `${questionText}. ${optionsText || ''}`;
      
      // Clear any existing timeout before setting a new one
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      // Add a small delay to allow UI to settle and avoid immediate speaking issues
      speechTimeoutRef.current = setTimeout(() => {
        // Check speaking and waiting state again before speaking
        if (speechSynthesis && !speechSynthesis.speaking && !speechSynthesis.paused && !waitingForSpeechClear) {
           speakText(fullText);
        } else {
           console.log('Did not auto-speak, synthesis busy, paused, or waiting.', { speaking: speechSynthesis?.speaking, paused: speechSynthesis?.paused, waiting: waitingForSpeechClear });
        }
      }, 750); // Increased delay slightly
    }

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
       // Stop speech if component unmounts while speaking due to question change
      if (speechSynthesis && (speechSynthesis.speaking || speechSynthesis.paused)) {
         speechSynthesis.cancel();
         setIsSpeaking(false);
         setWaitingForSpeechClear(false); // Reset waiting state on unmount
      }
    };
  }, [activeQuiz?.currentQuestionIndex, isTextToSpeechEnabled, isSpeaking, speakText, isClient, activeQuiz, speechSynthesis, setIsSpeaking, speechError, setSpeechError, waitingForSpeechClear, setWaitingForSpeechClear]); // Added dependencies

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
      if (isFullScreen && !currentlyFullscreen) { // Exited fullscreen
        incrementAndLogCheatingFlag('fullscreen_exit');
        toast({
            title: "Fullscreen Exited",
            description: "You have exited fullscreen mode. Please re-enter to continue the quiz without issues.",
            variant: "destructive"
        });
      }
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
    <div ref={quizPageRef} className="space-y-6 max-w-6xl mx-auto mindmash-quiz-area">
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
                  isTextToSpeechEnabled={isTextToSpeechEnabled}
                />
              </CardContent>
            </Card>
          )}
          <div className="flex justify-between items-center pt-4">
            <Button
              onClick={previousQuestion}
              disabled={activeQuiz.currentQuestionIndex === 0 || !!activeQuiz.completedAt}
              variant="outline"
              size="lg"
            >
              <ChevronLeft className="mr-2 h-5 w-5" /> Previous
            </Button>

            {activeQuiz.currentQuestionIndex < activeQuiz.questions.length - 1 ? (
              <Button onClick={nextQuestion} size="lg" disabled={!!activeQuiz.completedAt || !currentQ?.userAnswer}>
                Next <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="default" 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700 text-white dark:text-primary-foreground"
                    disabled={!!activeQuiz.completedAt || !currentQ?.userAnswer}
                  >
                    <CheckSquare className="mr-2 h-5 w-5" /> Submit Quiz
                  </Button>
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
        </div>

        <div className="lg:w-1/3 space-y-6 p-4 border rounded-lg shadow-md bg-blue-500/10 border-blue-500">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Quiz Status</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const newState = !isTextToSpeechEnabled;
                    setIsTextToSpeechEnabled(newState);
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
                  {isTextToSpeechEnabled ? (
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
                  {isTextToSpeechEnabled ? 'Enabled' : 'Disabled'} (F+J)
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
        </div>
      </div>
    </div>
  );
}
