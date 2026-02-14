import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const installedHandler = () => {
      // App was installed, reset state
      setDeferredPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      // Clear the prompt regardless of outcome
      setDeferredPrompt(null);
      
      if (choiceResult.outcome === 'accepted') {
        setCanInstall(false);
        return true;
      } else {
        // User dismissed, but prompt is consumed
        setCanInstall(false);
        return false;
      }
    } catch (error) {
      console.error('Error prompting install:', error);
      // Clear state on error
      setDeferredPrompt(null);
      setCanInstall(false);
      return false;
    }
  };

  return {
    canInstall,
    promptInstall,
  };
}
