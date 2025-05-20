import { useEffect } from 'react';
import { getAllOfflineQuizIds, getOfflineQuizAnswers, clearOfflineQuizAnswers } from '@/lib/utils';
import { saveUserQuizAnswer } from '@/lib/firestoreUtils';
import { useToast } from '@/hooks/use-toast';

/**
 * useOfflineQuizSync
 * Syncs offline quiz answers to Firestore when the user comes online.
 * Call this hook at the top level of your quiz page/component.
 */
export function useOfflineQuizSync(userId?: string) {
  const { toast } = useToast();

  useEffect(() => {
    async function syncOfflineAnswers() {
      if (!userId) return;
      const quizIds = await getAllOfflineQuizIds();
      if (quizIds.length === 0) return;
      let synced = 0;
      for (const quizId of quizIds) {
        const answers = await getOfflineQuizAnswers(quizId);
        for (const [questionId, answer] of Object.entries(answers)) {
          try {
            await saveUserQuizAnswer(userId, quizId, questionId, answer);
            synced++;
          } catch (err) {
            toast({
              title: 'Offline Sync Error',
              description: `Failed to sync answer for quiz ${quizId}.`,
              variant: 'destructive',
            });
            return;
          }
        }
        await clearOfflineQuizAnswers(quizId);
      }
      if (synced > 0) {
        toast({
          title: 'Offline Progress Synced',
          description: `Your offline quiz progress has been saved to the cloud!`,
          variant: 'default',
        });
      }
    }

    function handleOnline() {
      syncOfflineAnswers();
    }

    window.addEventListener('online', handleOnline);
    // Optionally, try to sync immediately if online
    if (navigator.onLine) {
      syncOfflineAnswers();
    }
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [userId, toast]);
} 