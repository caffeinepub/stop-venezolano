import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { COPY } from '../../content/copy';

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        console.error('Login error:', error);
        if (error instanceof Error && error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={disabled}
      variant={isAuthenticated ? 'outline' : 'default'}
      size="default"
      className="gap-2"
    >
      {loginStatus === 'logging-in' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {COPY.auth.signingIn}
        </>
      ) : isAuthenticated ? (
        <>
          <LogOut className="w-4 h-4" />
          {COPY.auth.signOut}
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4" />
          {COPY.auth.signIn}
        </>
      )}
    </Button>
  );
}
