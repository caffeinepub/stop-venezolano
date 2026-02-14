import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import type { UserId } from '../../backend';

export interface ScoreboardEntry {
  player: UserId;
  playerName: string;
  totalPoints: number;
  isCurrentUser?: boolean;
}

interface ScoreboardTableProps {
  entries: ScoreboardEntry[];
  isLoading?: boolean;
  maxScore?: number;
}

export function ScoreboardTable({ entries, isLoading, maxScore = 1000 }: ScoreboardTableProps) {
  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Cargando puntuaciones...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No hay puntuaciones disponibles
      </div>
    );
  }

  // Sort by points descending (backend-authoritative)
  const sortedEntries = [...entries].sort((a, b) => {
    const pointsA = typeof a.totalPoints === 'bigint' ? Number(a.totalPoints) : a.totalPoints;
    const pointsB = typeof b.totalPoints === 'bigint' ? Number(b.totalPoints) : b.totalPoints;
    return pointsB - pointsA;
  });

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Jugador</TableHead>
            <TableHead className="text-right">Puntos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEntries.map((entry, index) => {
            const displayPoints = typeof entry.totalPoints === 'bigint' 
              ? Number(entry.totalPoints) 
              : entry.totalPoints;

            return (
              <TableRow
                key={entry.player.toString()}
                className={entry.isCurrentUser ? 'bg-primary/5' : ''}
              >
                <TableCell className="text-center font-bold">
                  {index === 0 ? (
                    <Trophy className="w-5 h-5 text-yellow-500 mx-auto" />
                  ) : (
                    index + 1
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {entry.playerName}
                  {entry.isCurrentUser && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Tú
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {displayPoints}
                  <span className="text-xs text-muted-foreground ml-1">
                    / {maxScore}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
