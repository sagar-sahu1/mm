"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";

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

export default function CommunityPage() {
  const [quizzes, setQuizzes] = useState<CommunityQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  // Filter quizzes by search
  const filtered = quizzes.filter(q =>
    q.topic.toLowerCase().includes(search.toLowerCase()) ||
    (q.subtopic && q.subtopic.toLowerCase().includes(search.toLowerCase())) ||
    (q.creatorName && q.creatorName.toLowerCase().includes(search.toLowerCase()))
  );

  // Placeholder logic for trending/new/top-rated
  const trending = filtered.slice(0, 5);
  const newest = filtered.slice(0, 5);
  const topRated = filtered.slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto py-10 px-2 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Community Quiz Marketplace</h1>
      <Input
        type="text"
        placeholder="Search quizzes by topic, subtopic, or creator..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-6 max-w-md"
      />
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Section title="Trending" quizzes={trending} />
          <Section title="New" quizzes={newest} />
          <Section title="Top Rated" quizzes={topRated} />
        </>
      )}
    </div>
  );
}

function Section({ title, quizzes }: { title: string; quizzes: CommunityQuiz[] }) {
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
              <Link href={`/quiz/${q.id}`} className="mt-2 text-primary underline text-sm font-semibold">Take Quiz</Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 