import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { COPY } from '../content/copy';
import { useGetRoom, useLeaveRoom, useStartGame } from '../hooks/useQueries';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Users, Copy, ArrowLeft, Play, Share2, AlertCircle } from 'lucide-react';
import { SiWhatsapp, SiTelegram, SiFacebook } from 'react-icons/si';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  canUseWebShare,
  shareViaWebShare,
  getWhatsAppShareUrl,
  getTelegramShareUrl,
  getFacebookShareUrl,
  buildInviteMessage,
  buildJoinUrl,
  copyToClipboard,
} from '../utils/share';

const MAX_PLAYERS = 8;

export default function LobbyScreen() {
  const { roomId } = useParams({ from: '/lobby/$roomId' });
  const navigate = useNavigate();
  const { userProfile } = useCurrentUser();
  const { data: room, isLoading, error } = useGetRoom(BigInt(roomId));
  const leaveRoomMutation = useLeaveRoom();
  const startGameMutation = useStartGame();
  const [showShareDialog, setShowShareDialog] = useState(false);

  const isHost = room && userProfile && room.host.toString() === userProfile.id.toString();
  const isFull = room && room.players.length >= MAX_PLAYERS;

  useEffect(() => {
    if (room?.active) {
      navigate({ to: '/game/$roomId', params: { roomId } });
    }
  }, [room?.active, navigate, roomId]);

  const handleLeave = async () => {
    try {
      await leaveRoomMutation.mutateAsync(BigInt(roomId));
      navigate({ to: '/menu' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : COPY.errors.generic);
    }
  };

  const handleStart = async () => {
    if (isFull) {
      toast.error(COPY.lobby.roomFull);
      return;
    }
    
    try {
      await startGameMutation.mutateAsync(BigInt(roomId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : COPY.errors.generic);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    toast.success(COPY.lobby.roomCodeCopied);
  };

  const handleShare = async () => {
    const joinUrl = buildJoinUrl(roomId);
    const message = buildInviteMessage(roomId, joinUrl, COPY.lobby.shareMessage);

    if (canUseWebShare()) {
      const shared = await shareViaWebShare({
        title: COPY.splash.title,
        text: message,
        url: joinUrl,
      });

      if (shared) {
        toast.success(COPY.lobby.shareSuccess);
        setShowShareDialog(false);
      } else {
        // Fallback to dialog
        setShowShareDialog(true);
      }
    } else {
      setShowShareDialog(true);
    }
  };

  const handleCopyLink = async () => {
    const joinUrl = buildJoinUrl(roomId);
    const success = await copyToClipboard(joinUrl);
    if (success) {
      toast.success(COPY.lobby.linkCopied);
    } else {
      toast.error(COPY.lobby.shareError);
    }
  };

  const handleSharePlatform = (platform: 'whatsapp' | 'telegram' | 'facebook') => {
    const joinUrl = buildJoinUrl(roomId);
    const message = buildInviteMessage(roomId, joinUrl, COPY.lobby.shareMessage);

    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = getWhatsAppShareUrl(message);
        break;
      case 'telegram':
        shareUrl = getTelegramShareUrl(message);
        break;
      case 'facebook':
        shareUrl = getFacebookShareUrl(joinUrl);
        break;
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    toast.success(COPY.lobby.shareSuccess);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{COPY.lobby.loading}</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{COPY.lobby.roomNotFound}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{COPY.errors.roomNotFound}</p>
            <Button className="w-full" onClick={() => navigate({ to: '/menu' })}>
              {COPY.lobby.backToMenu}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                {COPY.lobby.title}
              </CardTitle>
              <Badge variant="outline">{room.mode}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isFull && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{COPY.lobby.roomFull}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{COPY.lobby.roomCode}</p>
                <p className="text-2xl font-bold font-mono">{roomId}</p>
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              {COPY.lobby.inviteFriends}
            </Button>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                {COPY.lobby.players} ({room.players.length}/{MAX_PLAYERS})
              </h3>
              <div className="space-y-2">
                {room.players.map((player, index) => (
                  <div key={player.toString()} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">
                      {COPY.lobby.player} {index + 1}
                      {player.toString() === room.host.toString() && (
                        <Badge variant="secondary" className="ml-2">
                          {COPY.lobby.host}
                        </Badge>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleLeave}>
                <ArrowLeft className="w-4 h-4" />
                {COPY.lobby.leave}
              </Button>
              {isHost && (
                <Button
                  className="flex-1 gap-2"
                  onClick={handleStart}
                  disabled={startGameMutation.isPending || room.players.length < 1 || isFull}
                >
                  <Play className="w-4 h-4" />
                  {COPY.lobby.startGame}
                </Button>
              )}
            </div>

            {!isHost && <p className="text-center text-sm text-muted-foreground">{COPY.lobby.waitingForHost}</p>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{COPY.lobby.inviteFriends}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{COPY.lobby.shareVia}</p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-auto py-4"
                onClick={() => handleSharePlatform('whatsapp')}
              >
                <SiWhatsapp className="w-8 h-8 text-green-600" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-auto py-4"
                onClick={() => handleSharePlatform('telegram')}
              >
                <SiTelegram className="w-8 h-8 text-blue-500" />
                <span className="text-xs">Telegram</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-auto py-4"
                onClick={() => handleSharePlatform('facebook')}
              >
                <SiFacebook className="w-8 h-8 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>
            </div>
            <Button variant="secondary" className="w-full gap-2" onClick={handleCopyLink}>
              <Copy className="w-4 h-4" />
              {COPY.lobby.copyLink}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
