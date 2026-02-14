import type { Score, UserId } from '../backend';

/**
 * Normalize backend Score array into a player-to-points map
 */
export function normalizeBackendScores(scores: Score[]): Record<string, number> {
  const normalized: Record<string, number> = {};
  
  scores.forEach((score) => {
    const playerId = score.player.toString();
    const points = Number(score.points);
    normalized[playerId] = points;
  });
  
  return normalized;
}

/**
 * Get player score from backend cumulative scores, with fallback to 0
 */
export function getPlayerScore(
  cumulativeScores: Score[],
  playerId: UserId
): number {
  const playerIdStr = playerId.toString();
  const scoreEntry = cumulativeScores.find(
    (s) => s.player.toString() === playerIdStr
  );
  
  return scoreEntry ? Number(scoreEntry.points) : 0;
}

/**
 * Sort players by score descending
 */
export function sortPlayersByScore(
  players: UserId[],
  cumulativeScores: Score[]
): Array<{ player: UserId; score: number }> {
  return players
    .map((player) => ({
      player,
      score: getPlayerScore(cumulativeScores, player),
    }))
    .sort((a, b) => b.score - a.score);
}
