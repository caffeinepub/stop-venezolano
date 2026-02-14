import type { UserId } from '../backend';

export interface ValidationResult {
  category: string;
  word: string;
  submitter: UserId;
  isValid: boolean;
}

export interface PlayerScore {
  player: UserId;
  points: number;
}

export interface RoundScores {
  roundNumber: number;
  scores: PlayerScore[];
}

/**
 * Calculate points for a single round based on validation results
 * Rules:
 * - Invalid word: 0 points
 * - Valid unique word: 100 points
 * - Valid repeated word: 50 points
 * - Empty submissions: 0 points
 */
export function calculateRoundScores(
  validationResults: ValidationResult[],
  players: UserId[]
): PlayerScore[] {
  const playerScores = new Map<string, number>();

  // Initialize all players with 0 points
  players.forEach((player) => {
    playerScores.set(player.toString(), 0);
  });

  // Handle empty validation results (all players get 0)
  if (!validationResults || validationResults.length === 0) {
    return Array.from(playerScores.entries()).map(([player, points]) => ({
      player: { toString: () => player } as UserId,
      points,
    }));
  }

  // Track which words have been seen (for detecting repeats)
  const seenWords = new Map<string, number>();

  // First pass: count occurrences of each valid word
  validationResults.forEach((result) => {
    if (result.isValid && result.word.trim() !== '') {
      const wordKey = result.word.toLowerCase().trim();
      seenWords.set(wordKey, (seenWords.get(wordKey) || 0) + 1);
    }
  });

  // Second pass: assign points
  validationResults.forEach((result) => {
    const playerId = result.submitter.toString();
    const currentScore = playerScores.get(playerId) || 0;

    if (!result.isValid || result.word.trim() === '') {
      // Invalid or empty: 0 points (no change)
      return;
    }

    const wordKey = result.word.toLowerCase().trim();
    const wordCount = seenWords.get(wordKey) || 0;

    if (wordCount === 1) {
      // Unique valid word: 100 points
      playerScores.set(playerId, currentScore + 100);
    } else {
      // Repeated valid word: 50 points
      playerScores.set(playerId, currentScore + 50);
    }
  });

  return Array.from(playerScores.entries()).map(([player, points]) => ({
    player: { toString: () => player } as UserId,
    points,
  }));
}

/**
 * Calculate cumulative scores across multiple rounds
 */
export function calculateCumulativeScores(
  roundScores: RoundScores[]
): Map<string, number> {
  const cumulativeScores = new Map<string, number>();

  roundScores.forEach((round) => {
    round.scores.forEach((score) => {
      const playerId = score.player.toString();
      const currentTotal = cumulativeScores.get(playerId) || 0;
      cumulativeScores.set(playerId, currentTotal + score.points);
    });
  });

  return cumulativeScores;
}
