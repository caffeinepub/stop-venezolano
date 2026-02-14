import { useNavigate } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { COPY } from '../content/copy';
import { Users, Globe, ShoppingBag, Shield, Download, Trophy } from 'lucide-react';
import LoginButton from '../components/auth/LoginButton';
import ProfileSetupModal from '../components/auth/ProfileSetupModal';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useIsAdmin } from '../hooks/useAdmin';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateRoom, useJoinRoom, useJoinMatchmaking } from '../hooks/useQueries';
import { toast } from 'sonner';
import { GameMode } from '../backend';
import { usePwaInstallPrompt } from '../hooks/usePwaInstallPrompt';

export default function MainMenuScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, displayName } = useCurrentUser();
  const { data: isAdmin } = useIsAdmin();
  const [showNearDialog, setShowNearDialog] = useState(false);
  const [nearMode, setNearMode] = useState<'create' | 'join'>('create');
  const [roomCode, setRoomCode] = useState('');
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const { canInstall, promptInstall } = usePwaInstallPrompt();

  const createRoomMutation = useCreateRoom();
  const joinRoomMutation = useJoinRoom();
  const joinMatchmakingMutation = useJoinMatchmaking();

  const handleCreateRoom = async () => {
    if (!isAuthenticated) {
      toast.error(COPY.errors.unauthorized);
      return;
    }

    try {
      const roomId = await createRoomMutation.mutateAsync({
        mode: GameMode.near,
        categories: ['Nombre', 'Ciudad', 'Animal', 'Color', 'Comida', 'Cosa'],
      });
      setShowNearDialog(false);
      navigate({ to: '/lobby/$roomId', params: { roomId: roomId.toString() } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : COPY.errors.generic;
      if (errorMessage.includes('full') || errorMessage.includes('8 players')) {
        toast.error(COPY.lobby.roomFull);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleJoinRoom = async () => {
    if (!isAuthenticated) {
      toast.error(COPY.errors.unauthorized);
      return;
    }

    if (!roomCode.trim()) {
      toast.error(COPY.nearDialog.enterRoomCode);
      return;
    }

    try {
      const roomId = BigInt(roomCode);
      await joinRoomMutation.mutateAsync(roomId);
      setShowNearDialog(false);
      navigate({ to: '/lobby/$roomId', params: { roomId: roomId.toString() } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : COPY.errors.generic;
      if (errorMessage.includes('full') || errorMessage.includes('8 players')) {
        toast.error(COPY.lobby.roomFull);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleFarMode = async () => {
    if (!isAuthenticated) {
      toast.error(COPY.errors.unauthorized);
      return;
    }

    try {
      await joinMatchmakingMutation.mutateAsync();
      toast.success('Buscando partida...');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : COPY.errors.generic;
      if (errorMessage.includes('full') || errorMessage.includes('8 players')) {
        toast.error(COPY.lobby.matchmakingFull);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleInstallClick = async () => {
    if (canInstall) {
      const installed = await promptInstall();
      if (installed) {
        toast.success(COPY.pwa.installSuccess);
      }
    } else {
      setShowInstallDialog(true);
    }
  };

  const handleMonthlyLeaderboard = () => {
    navigate({ to: '/monthly-leaderboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ProfileSetupModal />
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <img
            src="/assets/generated/stop-venezolano-logo-v2.dim_512x512.png"
            alt={COPY.splash.logoAlt}
            className="w-32 h-32 mx-auto"
          />
          <h1 className="text-5xl font-black text-foreground">{COPY.mainMenu.title}</h1>
          <p className="text-xl text-muted-foreground">{COPY.mainMenu.subtitle}</p>
          {isAuthenticated && (
            <p className="text-sm text-muted-foreground">
              {COPY.mainMenu.welcomeBack}, <span className="font-semibold text-foreground">{displayName}</span>!
            </p>
          )}
        </div>

        <div className="flex justify-center mb-6">
          <LoginButton />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowNearDialog(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                {COPY.mainMenu.near}
              </CardTitle>
              <CardDescription>{COPY.mainMenu.nearDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="default">
                {COPY.mainMenu.playNearby}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleFarMode}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-6 h-6" />
                {COPY.mainMenu.far}
              </CardTitle>
              <CardDescription>{COPY.mainMenu.farDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="default">
                {COPY.mainMenu.playOnline}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/store' })}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                {COPY.mainMenu.store}
              </CardTitle>
              <CardDescription>{COPY.mainMenu.storeDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                {COPY.mainMenu.visitStore}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleMonthlyLeaderboard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Monthly Leaderboard
              </CardTitle>
              <CardDescription>View top players and prizes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Rankings
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleInstallClick}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-6 h-6" />
                {COPY.pwa.downloadApp}
              </CardTitle>
              <CardDescription>{COPY.pwa.downloadDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                {COPY.pwa.installButton}
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/admin' })}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  {COPY.mainMenu.admin}
                </CardTitle>
                <CardDescription>{COPY.mainMenu.adminDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  {COPY.mainMenu.adminPanel}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showNearDialog} onOpenChange={setShowNearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{COPY.nearDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={nearMode === 'create' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setNearMode('create')}
              >
                {COPY.nearDialog.createRoom}
              </Button>
              <Button
                variant={nearMode === 'join' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setNearMode('join')}
              >
                {COPY.nearDialog.joinRoom}
              </Button>
            </div>

            {nearMode === 'create' ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {COPY.nearDialog.createDesc}
                </p>
                <Button className="w-full" onClick={handleCreateRoom} disabled={createRoomMutation.isPending}>
                  {createRoomMutation.isPending ? COPY.nearDialog.creating : COPY.nearDialog.createButton}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomCode">{COPY.nearDialog.roomCodeLabel}</Label>
                  <Input
                    id="roomCode"
                    placeholder={COPY.nearDialog.roomCodePlaceholder}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleJoinRoom} disabled={joinRoomMutation.isPending}>
                  {joinRoomMutation.isPending ? COPY.nearDialog.joining : COPY.nearDialog.joinButton}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{COPY.pwa.manualInstallTitle}</DialogTitle>
            <DialogDescription>{COPY.pwa.manualInstallDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">iOS (Safari):</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>{COPY.pwa.iosStep1}</li>
                <li>{COPY.pwa.iosStep2}</li>
                <li>{COPY.pwa.iosStep3}</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Android (Chrome):</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>{COPY.pwa.androidStep1}</li>
                <li>{COPY.pwa.androidStep2}</li>
                <li>{COPY.pwa.androidStep3}</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
