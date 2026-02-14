import { useNavigate } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { COPY } from '../../content/copy';

export default function PaymentFailureScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <CardTitle className="text-center">{COPY.payment.failure}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {COPY.payment.failureDesc}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate({ to: '/menu' })}>
              {COPY.payment.backToMenu}
            </Button>
            <Button className="flex-1" onClick={() => navigate({ to: '/store' })}>
              {COPY.payment.tryAgain}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
