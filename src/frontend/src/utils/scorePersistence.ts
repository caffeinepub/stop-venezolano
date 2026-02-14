interface RoundScoreData {
  roundNumber: number;
  scores: Record<string, number>;
}

interface MatchScoreData {
  roomId: string;
  rounds: RoundScoreData[];
  lastUpdated: number;
}

const STORAGE_KEY_PREFIX = 'stop_match_scores_';
const STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * DEPRECATED: Session storage is now non-authoritative fallback only.
 * Use backend cumulative scores from matchState.cumulativeScores instead.
 * 
 * Get stored scores for a room
 */
export function getStoredScores(roomId: string): MatchScoreData | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${roomId}`;
    const stored = sessionStorage.getItem(key);
    
    if (!stored) {
      return null;
    }

    const data: MatchScoreData = JSON.parse(stored);
    
    // Check if expired
    if (Date.now() - data.lastUpdated > STORAGE_EXPIRY_MS) {
      sessionStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading stored scores:', error);
    return null;
  }
}

/**
 * DEPRECATED: Session storage is now non-authoritative fallback only.
 * Backend maintains authoritative cumulative scores.
 * 
 * Store scores for a room and round (idempotent - prevents double-counting)
 */
export function storeRoundScores(
  roomId: string,
  roundNumber: number,
  scores: Record<string, number>
): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${roomId}`;
    const existing = getStoredScores(roomId);

    const rounds = existing?.rounds || [];
    
    // Check if this round already exists
    const existingRoundIndex = rounds.findIndex((r) => r.roundNumber === roundNumber);
    
    if (existingRoundIndex >= 0) {
      // Round already persisted, skip to prevent double-counting
      return;
    }
    
    // Add new round data
    rounds.push({ roundNumber, scores });

    const data: MatchScoreData = {
      roomId,
      rounds,
      lastUpdated: Date.now(),
    };

    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error storing scores:', error);
  }
}

/**
 * DEPRECATED: Session storage is now non-authoritative fallback only.
 * Use backend cumulative scores from matchState.cumulativeScores instead.
 * 
 * Get cumulative scores up to a specific round
 */
export function getCumulativeScores(
  roomId: string,
  upToRound?: number
): Record<string, number> {
  const stored = getStoredScores(roomId);
  
  if (!stored) {
    return {};
  }

  const cumulative: Record<string, number> = {};
  
  stored.rounds
    .filter((r) => !upToRound || r.roundNumber <= upToRound)
    .forEach((round) => {
      Object.entries(round.scores).forEach(([playerId, points]) => {
        cumulative[playerId] = (cumulative[playerId] || 0) + points;
      });
    });

  return cumulative;
}

/**
 * Clear stored scores for a room
 */
export function clearStoredScores(roomId: string): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${roomId}`;
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing stored scores:', error);
  }
}
