
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard - MindMash',
  description: 'See who is topping the charts on MindMash. Check out the leaderboard for top players.',
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
