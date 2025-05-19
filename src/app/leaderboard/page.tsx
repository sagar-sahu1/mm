"use client";

import React, { useEffect, useState } from 'react';
import { getLeaderboardUsers } from '@/lib/firestoreUtils';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trophy, UserCircle, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TimeFilter = 'weekly' | 'monthly' | 'allTime';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('weekly');

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      setError(null);
      try {
        const leaderboardUsers = await getLeaderboardUsers(10, timeFilter); 
        setUsers(leaderboardUsers);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        // Provide a more helpful error message
        if (err instanceof Error && err.message.includes('index')) {
          setError("There was an issue with the database index. The leaderboard will display limited data.");
          // Try to fetch with a simpler query as fallback
          try {
            const fallbackUsers = await getLeaderboardUsers(10, 'allTime');
            setUsers(fallbackUsers);
            setError(null);
          } catch (fallbackErr) {
            setError("Unable to load leaderboard data. Please try again later.");
          }
        } else {
          setError("Failed to load leaderboard data. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, [timeFilter]); // Re-fetch when time filter changes

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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-4">Global Leaderboard</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          See how you stack up against other learners. Earn points by completing quizzes and challenges to climb the rankings.
        </p>
      </div>
      
      {/* Display message when in fallback mode */}
      {error && (
        <div className="bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-md mb-4 text-center">
          {error}
        </div>
      )}
      
      {/* Time filter tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-muted/30 rounded-lg p-1 flex">
          <Button 
            variant={timeFilter === 'weekly' ? 'default' : 'ghost'} 
            className={cn("rounded-md px-8", timeFilter === 'weekly' ? '' : 'bg-transparent')}
            onClick={() => setTimeFilter('weekly')}
          >
            Weekly
          </Button>
          <Button 
            variant={timeFilter === 'monthly' ? 'default' : 'ghost'} 
            className={cn("rounded-md px-8", timeFilter === 'monthly' ? '' : 'bg-transparent')}
            onClick={() => setTimeFilter('monthly')}
          >
            Monthly
          </Button>
          <Button 
            variant={timeFilter === 'allTime' ? 'default' : 'ghost'} 
            className={cn("rounded-md px-8", timeFilter === 'allTime' ? '' : 'bg-transparent')}
            onClick={() => setTimeFilter('allTime')}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Top 3 users */}
      {users.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 items-end mb-12">
          {/* Second place */}
          {users.length > 1 && (
            <Card className="flex flex-col items-center p-6 text-center bg-gradient-to-br from-purple-400/10 to-blue-400/10 border-2 border-purple-500/30 shadow-lg order-first md:order-none">
              <div className="bg-purple-500/20 rounded-full p-3 mb-4">
                <Trophy className="h-16 w-16 text-gray-300" />
              </div>
              <Avatar className="h-28 w-28 border-4 border-purple-400 shadow-md">
                <AvatarImage src={users[1].photoURL || undefined} alt={users[1].displayName || 'User'} />
                <AvatarFallback className="text-2xl font-semibold bg-purple-500/20 text-purple-200">
                   {users[1].displayName?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-2xl font-semibold mt-4 text-purple-300">#2</h3>
              <h4 className="text-xl font-semibold mt-2">{users[1].displayName || 'Anonymous User'}</h4>
              <p className="text-3xl font-bold text-primary mt-2">{users[1].totalScore || 0} pts</p>
            </Card>
          )}
          
          {/* First place */}
          {users.length > 0 && (
            <Card className="flex flex-col items-center p-8 text-center bg-gradient-to-br from-primary/20 to-blue-500/20 border-2 border-primary/50 shadow-xl z-10">
              <div className="bg-yellow-500/20 rounded-full p-4 mb-4">
                <Trophy className="h-20 w-20 text-yellow-400" />
              </div>
              <Avatar className="h-32 w-32 border-4 border-primary shadow-lg">
                <AvatarImage src={users[0].photoURL || undefined} alt={users[0].displayName || 'User'} />
                <AvatarFallback className="text-3xl font-bold bg-primary/20 text-primary-foreground">
                  {users[0].displayName?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-3xl font-bold mt-4 text-yellow-400">#1</h3>
              <h4 className="text-2xl font-semibold mt-2">{users[0].displayName || 'Anonymous User'}</h4>
              <p className="text-4xl font-bold text-primary mt-2">{users[0].totalScore || 0} pts</p>
            </Card>
          )}
          
          {/* Third place */}
          {users.length > 2 && (
            <Card className="flex flex-col items-center p-6 text-center bg-gradient-to-br from-cyan-400/10 to-green-400/10 border-2 border-cyan-500/30 shadow-lg">
              <div className="bg-cyan-500/20 rounded-full p-3 mb-4">
                <Trophy className="h-16 w-16 text-yellow-600" />
              </div>
              <Avatar className="h-28 w-28 border-4 border-cyan-400 shadow-md">
                <AvatarImage src={users[2].photoURL || undefined} alt={users[2].displayName || 'User'} />
                <AvatarFallback className="text-2xl font-semibold bg-cyan-500/20 text-cyan-200">
                   {users[2].displayName?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-2xl font-semibold mt-4 text-yellow-600">#3</h3>
              <h4 className="text-xl font-semibold mt-2">{users[2].displayName || 'Anonymous User'}</h4>
              <p className="text-3xl font-bold text-primary mt-2">{users[2].totalScore || 0} pts</p>
            </Card>
          )}
        </div>
      )}

      {/* Leaderboard table for ranks 4+ */}
      {users.length > 3 && (
        <div className="bg-card rounded-lg overflow-hidden shadow-md border border-border">
          <table className="w-full leading-normal">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rank</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quizzes</th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accuracy</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(3).map((user, index) => {
                const rank = index + 4; // Start from rank 4
                const accuracy = user.totalScore && user.quizzesCompleted
                  ? ((user.totalScore / (user.quizzesCompleted * 100)) * 100).toFixed(1) 
                  : "0.0";
                
                return (
                  <tr key={user.uid} className="border-b border-border hover:bg-muted/20 transition-colors duration-150">
                    <td className="py-3 px-4 text-sm text-muted-foreground">{rank}</td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3 border-2 border-primary/20">
                          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                          <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary-foreground">
                             {user.displayName?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{user.displayName || 'Anonymous User'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-center text-foreground">{user.quizzesCompleted || 0}</td>
                    <td className="py-3 px-4 text-sm text-center text-foreground">{accuracy}%</td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-primary">{user.totalScore || 0} pts</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {users.length === 0 && (
        <Card className="max-w-lg mx-auto text-center shadow-lg">
          <CardHeader>
            <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">No Data Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base mb-6">
              The leaderboard is currently empty. Be the first to make your mark by completing quizzes!
            </CardDescription>
            <Button asChild>
              <Link href="/create-quiz">
                Create a Quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
