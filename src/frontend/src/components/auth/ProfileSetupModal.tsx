import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import { toast } from 'sonner';
import { COPY } from '../../content/copy';

export default function ProfileSetupModal() {
  const { userProfile, isAuthenticated, profileLoading, isFetched } = useCurrentUser();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const registerMutation = useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error(COPY.errors.actorNotAvailable);
      await actor.register(displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success(COPY.auth.welcomeMessage);
    },
    onError: (error: Error) => {
      toast.error(`${COPY.auth.registrationFailed}: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error(COPY.auth.nameMinLength);
      return;
    }
    registerMutation.mutate(name.trim());
  };

  return (
    <Dialog open={showProfileSetup} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{COPY.auth.welcome}</DialogTitle>
          <DialogDescription>
            {COPY.auth.welcomeDesc}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{COPY.auth.yourName}</Label>
            <Input
              id="name"
              placeholder={COPY.auth.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={registerMutation.isPending}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? COPY.auth.settingUp : COPY.auth.letsPlay}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
