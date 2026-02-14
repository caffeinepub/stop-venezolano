import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { COPY } from '../content/copy';
import { Trophy, Home, RotateCcw, Award } from 'lucide-react';
import { useGetRoom, useGetCurrentMatchState } from '../hooks/useQueries';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getPlayerScore } from '@/utils/backendScoring';

export default function RankingScreen() {
  const { roomId } = useParams({ from: '/ranking/$roomId' });
  const navigate = useNavigate();
  const { data: room, isLoading: roomLoading } = useGetRoom(BigInt(roomId));
  const { data: matchState, isLoading: matchLoading } = useGetCurrentMatchState(BigInt(roomId));
  const { userProfile } = useCurrentUser();

  const handlePlayAgain = () => {
    navigate({ to: '/menu' });
  };

  const handleBackToMenu = () => {
    navigate({ to: '/menu' });
  };

  const handleViewMonthlyLeaderboard = () => {
    navigate({ to: '/monthly-leaderboard' });
  };

  if (roomLoading || matchLoading || !room || !matchState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando ranking...</p>
      </div>
    );
  }

  const currentRound = Number(matchState.currentRound);
  const totalRounds = Number(matchState.totalRounds);
  const isMatchComplete = currentRound === totalRounds && !matchState.isActive;

  // Use backend-authoritative cumulative scores
  const cumulativeScores = matchState.cumulativeScores || [];
  
  // Build rankings from backend scores
  const rankings = room.players
    .map((player, index) => {
      const playerIndex = index + 1;
      const score = getPlayerScore(cumulativeScores, player);
      const isCurrentUser = userProfile?.id.toString() === player.toString();
      
      return {
        name: `${COPY.lobby.player} ${playerIndex}`,
        score,
        isCurrentUser,
        playerId: player.toString(),
      };
    })
    .sort((a, b) => b.score - a.score);

  // Check if current user is #1
  const isCurrentUserTop1 = isMatchComplete && 
    rankings.length > 0 && 
    rankings[0].isCurrentUser;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              {COPY.ranking.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Top 1 Congratulation Message */}
            {isCurrentUserTop1 && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500 rounded-lg p-6 text-center space-y-2">
                <Award className="w-12 h-12 text-yellow-500 mx-auto" />
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  ¡Felicidades quedaste top 1!
                </p>
              </div>
            )}

            <div className="space-y-3">
              {rankings.map((player, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0
                      ? 'bg-yellow-500/10 border-2 border-yellow-500'
                      : player.isCurrentUser
                      ? 'bg-primary/5 border-2 border-primary'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {COPY.ranking.position}{index + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{player.name}</p>
                      {index === 0 && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                          {COPY.ranking.winner}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{player.score}</span>
                    <span className="text-sm text-muted-foreground">{COPY.ranking.pts}</span>
                    {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleBackToMenu}>
                <Home className="w-4 h-4" />
                {COPY.ranking.backToMenu}
              </Button>
              <Button className="flex-1 gap-2" onClick={handlePlayAgain}>
                <RotateCcw className="w-4 h-4" />
                {COPY.ranking.playAgain}
              </Button>
            </div>

            {/* Monthly Leaderboard Button */}
            <Button 
              variant="secondary" 
              className="w-full gap-2" 
              onClick={handleViewMonthlyLeaderboard}
            >
              <Trophy className="w-4 h-4" />
              View Monthly Leaderboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
