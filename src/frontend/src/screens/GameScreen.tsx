import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { COPY } from '../content/copy';
import {
  useGetRoom,
  useSubmitWord,
  useGetCurrentMatchState,
  useStartRound,
  useStopCurrentRound,
} from '../hooks/useQueries';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Send, StopCircle } from 'lucide-react';
import { LetterRoulette } from '@/components/game/LetterRoulette';
import { ScoreboardTable, ScoreboardEntry } from '@/components/game/ScoreboardTable';
import { playStopVoice } from '@/utils/stopVoice';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getPlayerScore } from '@/utils/backendScoring';

export default function GameScreen() {
  const { roomId } = useParams({ from: '/game/$roomId' });
  const navigate = useNavigate();
  const { userProfile } = useCurrentUser();
  const { data: room, isLoading: roomLoading } = useGetRoom(BigInt(roomId));
  const { data: matchState, isLoading: matchLoading } = useGetCurrentMatchState(BigInt(roomId));
  const submitWordMutation = useSubmitWord();
  const startRoundMutation = useStartRound();
  const stopRoundMutation = useStopCurrentRound();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const lastRoundRef = useRef<number>(0);
  const lastLetterRef = useRef<string | null>(null);

  // Trigger roulette spin when a new round starts
  useEffect(() => {
    const currentRound = Number(matchState?.currentRound || 0);
    const currentLetter = matchState?.currentLetter || null;
    const isActive = matchState?.isActive || false;

    // Only spin if:
    // 1. Round is active
    // 2. There's a current letter
    // 3. Either the round number changed OR the letter changed (new round started)
    if (
      isActive &&
      currentLetter &&
      (currentRound !== lastRoundRef.current || currentLetter !== lastLetterRef.current)
    ) {
      setIsSpinning(true);
      lastRoundRef.current = currentRound;
      lastLetterRef.current = currentLetter;
    }
  }, [matchState?.currentRound, matchState?.currentLetter, matchState?.isActive]);

  const handleStartRound = async () => {
    try {
      setIsSpinning(true);
      await startRoundMutation.mutateAsync(BigInt(roomId));
    } catch (error) {
      setIsSpinning(false);
      toast.error(error instanceof Error ? error.message : COPY.errors.generic);
    }
  };

  const handleStopRound = async () => {
    try {
      // Play voice immediately on user gesture
      playStopVoice().catch(() => {
        // Non-blocking audio error
        toast.error(COPY.game.audioBlocked);
      });

      // Stop the round via backend
      await stopRoundMutation.mutateAsync(BigInt(roomId));
      toast.success(COPY.game.roundStopped);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : COPY.errors.generic);
    }
  };

  const handleSubmit = async () => {
    try {
      for (const category of room?.categories || []) {
        if (answers[category]) {
          await submitWordMutation.mutateAsync({
            roomId: BigInt(roomId),
            category,
            word: answers[category],
          });
        }
      }
      toast.success(COPY.game.answersSubmitted);
      navigate({ to: '/tribunal/$roomId', params: { roomId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : COPY.errors.generic);
    }
  };

  if (roomLoading || matchLoading || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{COPY.game.loading}</p>
      </div>
    );
  }

  const currentRound = Number(matchState?.currentRound || 0);
  const totalRounds = Number(matchState?.totalRounds || 10);
  const currentLetter = matchState?.currentLetter || null;
  const usedLetters = matchState?.usedLetters || [];
  const isActive = matchState?.isActive || false;

  // Use backend-authoritative cumulative scores
  const cumulativeScores = matchState?.cumulativeScores || [];

  // Build scoreboard entries from backend scores
  const scoreboardEntries: ScoreboardEntry[] = room.players.map((player, index) => ({
    player,
    playerName: `${COPY.lobby.player} ${index + 1}`,
    totalPoints: getPlayerScore(cumulativeScores, player),
    isCurrentUser: userProfile?.id.toString() === player.toString(),
  }));

  const currentUserScore = userProfile ? getPlayerScore(cumulativeScores, userProfile.id) : 0;
  const maxScore = 1000;

  // Show start button if no round is active
  const showStartButton = currentRound === 0 || (!isActive && currentRound < totalRounds);
  const showStopButton = isActive && currentLetter;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <CardTitle className="text-center text-3xl">{COPY.game.title}</CardTitle>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {COPY.game.round} {currentRound} {COPY.game.of} {totalRounds}
                </Badge>
                <Badge variant="default" className="text-lg px-4 py-2">
                  {currentUserScore} {COPY.game.of} {maxScore} {COPY.ranking.pts}
                </Badge>
              </div>

              {/* Letter Roulette */}
              {currentLetter && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">{COPY.game.startingLetter}</p>
                  <LetterRoulette
                    selectedLetter={currentLetter}
                    usedLetters={usedLetters}
                    isSpinning={isSpinning}
                    onSpinComplete={() => setIsSpinning(false)}
                  />
                </div>
              )}

              {/* Start Round Button */}
              {showStartButton && (
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleStartRound}
                    disabled={startRoundMutation.isPending}
                    className="gap-2"
                  >
                    {startRoundMutation.isPending ? COPY.game.startingRound : COPY.game.startRound}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          {currentLetter && isActive && (
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {room.categories.map((category) => (
                  <div key={category} className="space-y-2">
                    <Label htmlFor={category} className="text-base font-semibold">
                      {category}
                    </Label>
                    <Input
                      id={category}
                      placeholder={COPY.game.enterAnswer}
                      value={answers[category] || ''}
                      onChange={(e) => setAnswers({ ...answers, [category]: e.target.value })}
                      disabled={!isActive}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate({ to: '/menu' })}>
                  <ArrowLeft className="w-4 h-4" />
                  {COPY.game.exit}
                </Button>

                {/* STOP Button */}
                {showStopButton && (
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={handleStopRound}
                    disabled={stopRoundMutation.isPending}
                  >
                    <StopCircle className="w-4 h-4" />
                    {stopRoundMutation.isPending ? COPY.game.stopping : COPY.game.stop}
                  </Button>
                )}

                <Button
                  className="flex-1 gap-2"
                  onClick={handleSubmit}
                  disabled={submitWordMutation.isPending || !isActive}
                >
                  <Send className="w-4 h-4" />
                  {submitWordMutation.isPending ? COPY.game.submitting : COPY.game.submit}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted rounded-lg">
                <p className="font-semibold">{COPY.game.score}:</p>
                <p>• {COPY.scoring.validWord}</p>
                <p>• {COPY.scoring.repeatedWord}</p>
                <p>• {COPY.scoring.emptyWord}</p>
                <p className="font-semibold mt-2">{COPY.game.maxScore}</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Scoreboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{COPY.game.scoreboard}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreboardTable entries={scoreboardEntries} isLoading={matchLoading} maxScore={maxScore} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
