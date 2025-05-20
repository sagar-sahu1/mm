"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Share2, PlusCircle, Repeat2, UserCircle } from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { addDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  // Filtering/sorting state
  const [filterTopic, setFilterTopic] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterCreator, setFilterCreator] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  // Story sharing state
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [storySubmitting, setStorySubmitting] = useState(false);
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    async function fetchQuizzes() {
      setLoading(true);
      const db = getDb();
      const quizzesRef = collection(db, "quizzes");
      const q = query(quizzesRef, where("isPublic", "==", true), orderBy("createdAt", "desc"), limit(50));
      const snapshot = await getDocs(q);
      const data: CommunityQuiz[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as CommunityQuiz);
      });
      setQuizzes(data);
      setLoading(false);
    }
    fetchQuizzes();
  }, []);

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

  // Get unique topics, difficulties, creators from quizzes
  const topics = Array.from(new Set(quizzes.map(q => q.topic).filter(Boolean)));
  const difficulties = Array.from(new Set(quizzes.map(q => q.difficulty).filter(Boolean)));
  const creators = Array.from(new Set(quizzes.map(q => q.creatorName || '').filter(c => c)));

  // Filter quizzes by search and filters
  let filtered = quizzes.filter(q =>
    (q.topic.toLowerCase().includes(search.toLowerCase()) ||
      (q.subtopic && q.subtopic.toLowerCase().includes(search.toLowerCase())) ||
      (q.creatorName && q.creatorName.toLowerCase().includes(search.toLowerCase()))) &&
    (!filterTopic || q.topic === filterTopic) &&
    (!filterDifficulty || q.difficulty === filterDifficulty) &&
    (!filterCreator || (q.creatorName || '') === filterCreator)
  );

  // Sort quizzes
  if (sortBy === 'newest') {
    filtered = filtered.slice().sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } else if (sortBy === 'popular') {
    filtered = filtered.slice().sort((a, b) => ((b.likes || 0) + (b.totalAttempts || 0)) - ((a.likes || 0) + (a.totalAttempts || 0)));
  }

  // Placeholder logic for trending/new/top-rated
  const trending = filtered.slice(0, 5);
  const newest = filtered.slice(0, 5);
  const topRated = filtered.slice(0, 5);

  function handleReport(quizId: string) {
    setReportQuizId(quizId);
    setReportOpen(true);
    setReportReason('');
    setReportComments('');
  }

  async function submitReport() {
    if (!reportQuizId || !reportReason) return;
    setReportSubmitting(true);
    try {
      const db = getDb();
      await addDoc(collection(db, 'quizReports'), {
        quizId: reportQuizId,
        userId: currentUser?.uid || null,
        reason: reportReason,
        comments: reportComments,
        createdAt: Timestamp.now(),
      });
      toast({
        title: 'Report submitted',
        description: 'Thank you for helping us keep the community safe.',
        variant: 'default',
      });
      setReportOpen(false);
    } catch (err) {
      toast({
        title: 'Error submitting report',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setReportSubmitting(false);
    }
  }

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

  return (
    <div className="max-w-5xl mx-auto py-10 px-2 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Community Quiz Marketplace</h1>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <Button onClick={() => setStoryOpen(true)} className="w-full sm:w-auto flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Share Your Story
        </Button>
        <div className="flex flex-col md:flex-row md:items-end md:gap-4 gap-2 mb-4">
          <Input
            type="text"
            placeholder="Search quizzes by topic, subtopic, or creator..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterTopic} onValueChange={setFilterTopic}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filter by Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Topics</SelectItem>
              {topics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filter by Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Difficulties</SelectItem>
              {difficulties.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCreator} onValueChange={setFilterCreator}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filter by Creator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Creators</SelectItem>
              {creators.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
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
            <Button onClick={submitReport} disabled={!reportReason || reportSubmitting}>
              {reportSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
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
      {/* Story Feed */}
      {stories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Community Stories</h2>
          <div className="flex flex-col gap-4">
            {stories.map(story => (
              <div key={story.id} className="bg-card border rounded-lg p-4 flex gap-4 items-start shadow-sm">
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
              </div>
            ))}
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Section title="Trending" quizzes={trending} onReport={handleReport} />
          <Section title="New" quizzes={newest} onReport={handleReport} />
          <Section title="Top Rated" quizzes={topRated} onReport={handleReport} />
        </>
      )}
    </div>
  );
}

function Section({ title, quizzes, onReport }: { title: string; quizzes: CommunityQuiz[]; onReport: (quizId: string) => void }) {
  if (!quizzes.length) return null;
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {quizzes.map(q => (
          <Card key={q.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-bold truncate">{q.topic}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {q.subtopic && <span>Subtopic: {q.subtopic} | </span>}
                Difficulty: <span className="capitalize">{q.difficulty}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="text-xs text-muted-foreground">By: {q.creatorName || "Unknown"}</div>
              <div className="flex gap-4 text-xs">
                <span>Attempts: {q.totalAttempts || 0}</span>
                <span>Likes: {q.likes || 0}</span>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Link href={`/quiz/${q.id}`} className="text-primary underline text-sm font-semibold">Take Quiz</Link>
                <Link href={`/create-quiz?remix=${q.id}`} title="Remix this quiz" aria-label="Remix Quiz">
                  <Button variant="ghost" size="icon">
                    <Repeat2 className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => onReport(q.id)} title="Report Quiz" aria-label="Report Quiz">
                  <span role="img" aria-label="Report">🚩</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 