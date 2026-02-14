import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { COPY } from '../content/copy';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { useGetValidationResults, useGetRoom } from '../hooks/useQueries';

export default function TribunalScreen() {
  const { roomId } = useParams({ from: '/tribunal/$roomId' });
  const navigate = useNavigate();
  const { data: validationResults, isLoading } = useGetValidationResults(BigInt(roomId));
  const { data: room } = useGetRoom(BigInt(roomId));

  const handleContinue = () => {
    navigate({ to: '/ranking/$roomId', params: { roomId } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando resultados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{COPY.tribunal.title}</CardTitle>
            <p className="text-center text-muted-foreground">
              Resultados de validación automática
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {validationResults && validationResults.length > 0 ? (
                validationResults.map((result, index) => {
                  const playerIndex = room?.players.findIndex(
                    (p) => p.toString() === result.submitter.toString()
                  );
                  const playerName = playerIndex !== undefined && playerIndex >= 0
                    ? `${COPY.lobby.player} ${playerIndex + 1}`
                    : 'Jugador';

                  return (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {result.category}: "{result.word}"
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {COPY.tribunal.submittedBy} {playerName}
                          </p>
                        </div>
                        <Badge variant={result.isValid ? 'default' : 'destructive'}>
                          {result.isValid ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Válida
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              Inválida
                            </span>
                          )}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground">
                  No hay respuestas para validar
                </p>
              )}
            </div>

            <Button className="w-full gap-2" onClick={handleContinue}>
              {COPY.tribunal.continueToResults}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
