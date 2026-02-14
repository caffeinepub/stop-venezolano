import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { COPY } from '../content/copy';
import { Play } from 'lucide-react';

export default function SplashScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: 'url(/assets/generated/splash-bg.dim_1920x1080.png)' }}
      />
      <div className="relative z-10 text-center space-y-8 max-w-2xl">
        <div className="space-y-4">
          <img
            src="/assets/generated/stop-sign-classic.dim_512x512.png"
            alt={COPY.splash.logoAlt}
            className="w-48 h-48 mx-auto drop-shadow-2xl"
          />
          <h1 className="text-6xl md:text-7xl font-black text-foreground tracking-tight">
            {COPY.splash.title}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            {COPY.splash.subtitle}
          </p>
        </div>
        <Button
          size="lg"
          className="text-lg px-8 py-6 gap-3 shadow-xl hover:shadow-2xl transition-all"
          onClick={() => navigate({ to: '/menu' })}
        >
          <Play className="w-6 h-6" />
          {COPY.splash.cta}
        </Button>
      </div>
    </div>
  );
}
