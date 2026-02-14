import { Outlet } from '@tanstack/react-router';
import { Heart, Download } from 'lucide-react';
import { COPY } from '../../content/copy';
import { Button } from '../ui/button';
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';

export default function AppLayout() {
  const currentYear = new Date().getFullYear();
  const appIdentifier = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'stop-venezolano'
  );
  const { canInstall, promptInstall } = usePwaInstallPrompt();
  const [showInstallDialog, setShowInstallDialog] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/10">
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <footer className="w-full py-4 px-4 border-t border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap justify-center">
              <span>© {currentYear} {COPY.splash.title}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                {COPY.footer.builtWith} <Heart className="w-4 h-4 text-red-500 fill-red-500" /> {COPY.footer.using}{' '}
                <a
                  href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-foreground transition-colors underline decoration-dotted"
                >
                  caffeine.ai
                </a>
              </span>
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleInstallClick}
            >
              <Download className="w-4 h-4" />
              {COPY.pwa.downloadApp}
            </Button>
          </div>
        </div>
      </footer>

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
