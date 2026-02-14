import { useNavigate } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCreateCheckoutSession } from '../../hooks/useStripeCheckout';
import { toast } from 'sonner';
import type { ShoppingItem } from '../../backend';
import { COPY } from '../../content/copy';

export default function StoreScreen() {
  const navigate = useNavigate();
  const createCheckoutSession = useCreateCheckoutSession();

  const products = [
    {
      id: 'premium_categories',
      name: COPY.store.premiumCategories,
      description: COPY.store.premiumCategoriesDesc,
      price: 999,
    },
    {
      id: 'avatar_skins',
      name: COPY.store.avatarSkins,
      description: COPY.store.avatarSkinsDesc,
      price: 499,
    },
    {
      id: 'ad_removal',
      name: COPY.store.adRemoval,
      description: COPY.store.adRemovalDesc,
      price: 299,
    },
  ];

  const handlePurchase = async (product: typeof products[0]) => {
    try {
      const item: ShoppingItem = {
        productName: product.name,
        productDescription: product.description,
        priceInCents: BigInt(product.price),
        currency: 'usd',
        quantity: BigInt(1),
      };

      const session = await createCheckoutSession.mutateAsync([item]);
      if (!session?.url) throw new Error(COPY.errors.sessionMissingUrl);
      window.location.href = session.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : COPY.errors.purchaseFailed);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: '/menu' })}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{COPY.store.title}</h1>
            <p className="text-muted-foreground">{COPY.store.subtitle}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${(product.price / 100).toFixed(2)}</div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full gap-2"
                  onClick={() => handlePurchase(product)}
                  disabled={createCheckoutSession.isPending}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {createCheckoutSession.isPending ? COPY.store.purchasing : COPY.store.purchase}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
