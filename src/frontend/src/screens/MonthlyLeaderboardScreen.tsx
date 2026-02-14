import { useNavigate } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Home, Award, TrendingUp } from 'lucide-react';
import { useGetCurrentMonthLeaderboard, useGetCurrentTop1 } from '../hooks/useQueries';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function MonthlyLeaderboardScreen() {
  const navigate = useNavigate();
  const { data: leaderboard, isLoading, error } = useGetCurrentMonthLeaderboard();
  const { data: top1 } = useGetCurrentTop1();
  const { userProfile } = useCurrentUser();

  const handleBackToMenu = () => {
    navigate({ to: '/menu' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading monthly leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Failed to load monthly leaderboard. Please try again later.
            </p>
            <Button className="w-full" onClick={handleBackToMenu}>
              <Home className="w-4 h-4 mr-2" />
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const hasData = leaderboard && leaderboard.length > 0;
  const top1PlayerId = top1?.userId.toString();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2 text-3xl">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Monthly Leaderboard
            </CardTitle>
            <CardDescription className="text-center text-lg">
              {currentMonth}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prize Eligibility Banner */}
            {top1 && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-yellow-600 dark:text-yellow-400">
                      Top 1 Prize Eligible
                    </p>
                    <p className="text-sm text-muted-foreground">
                      The #1 player at the end of the month wins prizes!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard List */}
            {hasData ? (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = userProfile?.id.toString() === entry.userId.toString();
                  const isTop1 = entry.userId.toString() === top1PlayerId;
                  const rank = index + 1;

                  return (
                    <div
                      key={entry.userId.toString()}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                        isTop1
                          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500 shadow-lg'
                          : isCurrentUser
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border-2">
                          <span className={`text-lg font-bold ${isTop1 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                            #{rank}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              Player {entry.userId.toString().slice(0, 8)}...
                            </p>
                            {isCurrentUser && (
                              <Badge variant="default" className="text-xs">
                                You
                              </Badge>
                            )}
                            {isTop1 && (
                              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                                <Award className="w-3 h-3 mr-1" />
                                Prize Eligible
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{Number(entry.rounds)} rounds</span>
                            <span>•</span>
                            <span>{Number(entry.wins)} wins</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <div className="text-right">
                          <p className="text-2xl font-bold">{Number(entry.points)}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                        {isTop1 && <Trophy className="w-6 h-6 text-yellow-500 ml-2" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-muted-foreground">
                    No data yet this month
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Play matches to appear on the leaderboard!
                  </p>
                </div>
              </div>
            )}

            <Button className="w-full gap-2" onClick={handleBackToMenu}>
              <Home className="w-4 h-4" />
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
