
"use client";

import React, { useEffect, useState } from 'react';
import { getLeaderboardUsers } from '@/lib/firestoreUtils';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trophy, UserCircle, BarChart3, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      setError(null);
      try {
        const leaderboardUsers = await getLeaderboardUsers(10); // Fetch top 10 users
        setUsers(leaderboardUsers);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError(err instanceof Error ? err.message : "Failed to load leaderboard data.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-lg mx-auto text-center shadow-lg">
        <CardHeader>
          <BarChart3 className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle className="text-2xl">Leaderboard Error</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base mb-6">
            {error}
          </CardDescription>
          <Button asChild>
            <Link href="/">
               Go to Homepage
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold">MindMash Leaderboard</CardTitle>
          <CardDescription className="text-xl text-muted-foreground">
            Top players paving the way!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground text-lg">
              The leaderboard is currently empty. Be the first to make your mark!
            </p>
          ) : (
            <ul className="space-y-4">
              {users.map((user, index) => (
                <li key={user.uid} className="p-0">
                  <Card className="flex items-center p-4 hover:shadow-md transition-shadow">
                    <span className="text-2xl font-bold text-primary w-10 text-center">{index + 1}</span>
                    <Avatar className="h-12 w-12 ml-4 mr-4">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback>
                        <UserCircle className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <p className="text-lg font-semibold text-card-foreground">{user.displayName || 'Anonymous User'}</p>
                      <p className="text-sm text-muted-foreground">
                        Score: {user.totalScore || 0} | Quizzes: {user.quizzesCompleted || 0}
                      </p>
                    </div>
                    {/* Optionally, add a badge or icon for top 3 */}
                    {index < 3 && (
                        <Trophy className={`h-6 w-6 ml-auto ${
                            index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-yellow-700'
                        }`} />
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
