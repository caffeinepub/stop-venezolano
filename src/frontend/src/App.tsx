import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import SplashScreen from './screens/SplashScreen';
import MainMenuScreen from './screens/MainMenuScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import TribunalScreen from './screens/TribunalScreen';
import RankingScreen from './screens/RankingScreen';
import MonthlyLeaderboardScreen from './screens/MonthlyLeaderboardScreen';
import StoreScreen from './screens/store/StoreScreen';
import PaymentSuccessScreen from './screens/store/PaymentSuccessScreen';
import PaymentFailureScreen from './screens/store/PaymentFailureScreen';
import AdminScreen from './screens/admin/AdminScreen';
import AppLayout from './components/layout/AppLayout';

const rootRoute = createRootRoute({
  component: AppLayout,
});

const splashRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: SplashScreen,
});

const mainMenuRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/menu',
  component: MainMenuScreen,
});

const lobbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lobby/$roomId',
  component: LobbyScreen,
});

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/game/$roomId',
  component: GameScreen,
});

const tribunalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tribunal/$roomId',
  component: TribunalScreen,
});

const rankingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ranking/$roomId',
  component: RankingScreen,
});

const monthlyLeaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/monthly-leaderboard',
  component: MonthlyLeaderboardScreen,
});

const storeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/store',
  component: StoreScreen,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-success',
  component: PaymentSuccessScreen,
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-failure',
  component: PaymentFailureScreen,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminScreen,
});

const routeTree = rootRoute.addChildren([
  splashRoute,
  mainMenuRoute,
  lobbyRoute,
  gameRoute,
  tribunalRoute,
  rankingRoute,
  monthlyLeaderboardRoute,
  storeRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
