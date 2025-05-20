"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Share2, PlusCircle, Repeat2, UserCircle } from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, updateDoc, increment, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { addDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


interface CommunityQuiz {
  id: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  createdAt?: any;
  isPublic?: boolean;
  creatorName?: string;
  totalAttempts?: number;
  likes?: number;
  challengeDate?: string;
}

const REPORT_REASONS = [
  'Inappropriate Content',
  'Spam or Advertising',
  'Incorrect Information',
  'Other',
];

export default function CommunityPage() {
  const [quizzes, setQuizzes] = useState<CommunityQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportQuizId, setReportQuizId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportComments, setReportComments] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Story sharing state
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [storySubmitting, setStorySubmitting] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [storyInput, setStoryInput] = useState('');

  // Fetch stories
  useEffect(() => {
    async function fetchStories() {
      const db = getDb();
      const storiesRef = collection(db, 'stories');
      const q = query(storiesRef, orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      const data: any[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setStories(data);
    }
    fetchStories();
  }, []);


  async function submitStory() {
    if (!storyContent.trim()) return;
    setStorySubmitting(true);
    try {
      const db = getDb();
      await addDoc(collection(db, 'stories'), {
        userId: currentUser?.uid || null,
        userName: currentUser?.displayName || currentUser?.email || 'Anonymous',
        userAvatar: currentUser?.photoURL || null,
        content: storyContent,
        createdAt: Timestamp.now(),
      });
      toast({
        title: 'Story shared!',
        description: 'Your story has been posted to the community.',
        variant: 'default',
      });
      setStoryOpen(false);
      setStoryContent('');
      // Refresh stories
      const storiesRef = collection(db, 'stories');
      const q = query(storiesRef, orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      const data: any[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setStories(data);
    } catch (err) {
      toast({
        title: 'Error sharing story',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setStorySubmitting(false);
    }
  }

  // Add a new submitStoryBox function for the inline story box
  async function submitStoryBox() {
    if (!storyInput.trim()) return;
    setStorySubmitting(true);
    try {
      const db = getDb();
      await addDoc(collection(db, 'stories'), {
        userId: currentUser?.uid || null,
        userName: currentUser?.displayName || currentUser?.email || 'Anonymous',
        userAvatar: currentUser?.photoURL || null,
        content: storyInput,
        createdAt: Timestamp.now(),
      });
      toast({
        title: 'Story shared!',
        description: 'Your story has been posted to the community.',
        variant: 'default',
      });
      setStoryInput('');
      // Refresh stories
      const storiesRef = collection(db, 'stories');
      const q = query(storiesRef, orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      const data: any[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setStories(data);
    } catch (err) {
      toast({
        title: 'Error sharing story',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setStorySubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-2 space-y-8">
      {/* Share Your Stories and Queries Box - Redesigned as a gradient card with adaptive theming */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-primary/80 to-secondary/80 dark:from-gray-900 dark:to-gray-800 rounded-xl p-8 min-h-[220px] shadow-lg flex flex-col justify-center">
          <label htmlFor="story-input" className="font-semibold mb-2 text-white text-lg dark:text-gray-100">Share Your Stories Or Queries</label>
          <div className="flex flex-col sm:flex-row items-end gap-2 w-full">
            <Textarea
              id="story-input"
              value={storyInput}
              onChange={e => setStoryInput(e.target.value)}
              placeholder="Write your story, experience, or learning journey..."
              className="min-h-[100px] flex-1 bg-white/90 dark:bg-gray-900/80 text-black dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-md border-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={submitStoryBox}
              disabled={!storyInput.trim() || storySubmitting}
              className="h-12 mt-2 sm:mt-0 bg-white text-primary font-bold hover:bg-primary/90 hover:text-white transition dark:bg-gray-800 dark:text-primary dark:hover:bg-primary dark:hover:text-white"
            >
              {storySubmitting ? 'Sharing...' : 'Share'}
            </Button>
          </div>
        </div>
      </div>
      {/* Community Stories Feed */}
      {stories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Community Stories</h2>
          <div className="flex flex-col gap-4">
            {stories.map(story => (
              <StoryCard key={story.id} story={story} currentUser={currentUser} toast={toast} />
            ))}
          </div>
        </div>
      )}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
              >
                <option value="">Select a reason...</option>
                {REPORT_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Additional Comments (optional)</label>
              <Textarea
                value={reportComments}
                onChange={e => setReportComments(e.target.value)}
                placeholder="Add any details to help us review this quiz..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            {/* Reporting is deprecated; no submit button */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={storyOpen} onOpenChange={setStoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Story</DialogTitle>
          </DialogHeader>
          <Textarea
            value={storyContent}
            onChange={e => setStoryContent(e.target.value)}
            placeholder="Write your story, experience, or learning journey..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button onClick={submitStory} disabled={!storyContent.trim() || storySubmitting}>
              {storySubmitting ? 'Sharing...' : 'Share Story'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StoryCard({ story, currentUser, toast }: { story: any; currentUser: any; toast: any }) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<string[]>(story.comments || []);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    // Fetch comments for this story
    async function fetchComments() {
      setLoadingComments(true);
      const db = getDb();
      const commentsRef = collection(db, 'stories', story.id, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      const data: string[] = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        data.push(`${d.userName || 'Anonymous'}: ${d.content}`);
      });
      setComments(data);
      setLoadingComments(false);
    }
    fetchComments();
  }, [story.id]);

  useEffect(() => {
    // Fetch likes from Firestore
    async function fetchLikes() {
      const db = getDb();
      const storyRef = doc(db, 'stories', story.id);
      const storySnap = await getDoc(storyRef);
      setLikes(storySnap.exists() && storySnap.data().likes ? storySnap.data().likes : 0);
    }
    fetchLikes();
  }, [story.id]);

  const handleLike = async () => {
    const db = getDb();
    const storyRef = doc(db, 'stories', story.id);
    try {
      await updateDoc(storyRef, { likes: increment(liked ? -1 : 1) });
      setLikes(likes + (liked ? -1 : 1));
      setLiked(!liked);
    } catch (err) {
      toast({ title: 'Error updating like', description: 'Please try again later.', variant: 'destructive' });
    }
  };

  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    try {
      const db = getDb();
      await addDoc(collection(db, 'stories', story.id, 'comments'), {
        userId: currentUser?.uid || null,
        userName: currentUser?.displayName || currentUser?.email || 'Anonymous',
        userAvatar: currentUser?.photoURL || null,
        content: comment,
        createdAt: Timestamp.now(),
      });
      setComments(prev => [...prev, `${currentUser?.displayName || currentUser?.email || 'Anonymous'}: ${comment}`]);
      setComment('');
    } catch (err) {
      toast({
        title: 'Error submitting comment',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center gap-3">
        {story.userAvatar ? (
          <img src={story.userAvatar} alt={story.userName} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <UserCircle className="h-10 w-10 text-muted-foreground" />
        )}
        <div className="flex-1">
          <div className="font-semibold text-sm mb-1">{story.userName || 'Anonymous'}</div>
          <div className="text-base mb-1 whitespace-pre-line">{story.content}</div>
          <div className="text-xs text-muted-foreground">{story.createdAt?.seconds ? new Date(story.createdAt.seconds * 1000).toLocaleString() : ''}</div>
        </div>
        <div className="flex flex-col items-center">
          <Button variant="ghost" size="icon" onClick={handleLike} title={liked ? 'Unlike' : 'Like'} aria-label={liked ? 'Unlike' : 'Like'}>
            <span role="img" aria-label="Like">💖</span>
          </Button>
          <span className="text-xs">{likes}</span>
        </div>
      </div>
      {/* Comments */}
      <div className="mt-2">
        <div className="font-semibold text-xs mb-1">Comments:</div>
        {loadingComments ? (
          <div className="text-xs text-muted-foreground">Loading comments...</div>
        ) : comments.length > 0 ? (
          <ul className="text-xs text-muted-foreground space-y-1">
            {comments.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        ) : (
          <div className="text-xs text-muted-foreground">No comments yet.</div>
        )}
        <div className="flex gap-2 mt-2">
          <Input
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1"
          />
          <Button onClick={handleSubmitComment} disabled={!comment.trim()} size="sm">Comment</Button>
        </div>
      </div>
    </div>
  );
} 