import { useNavigate } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Ban } from 'lucide-react';
import { useIsAdmin, useGetMetrics, useAddWord, useBanWord } from '../../hooks/useAdmin';
import { useState } from 'react';
import { toast } from 'sonner';
import { COPY } from '../../content/copy';

export default function AdminScreen() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: metrics } = useGetMetrics();
  const addWordMutation = useAddWord();
  const banWordMutation = useBanWord();
  const [newWord, setNewWord] = useState('');
  const [banWordInput, setBanWordInput] = useState('');

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{COPY.admin.loading}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{COPY.admin.accessDenied}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{COPY.admin.accessDeniedDesc}</p>
            <Button className="w-full" onClick={() => navigate({ to: '/menu' })}>
              {COPY.admin.backToMenu}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddWord = async () => {
    if (!newWord.trim()) {
      toast.error(COPY.admin.enterWord);
      return;
    }
    try {
      await addWordMutation.mutateAsync(newWord.trim());
      toast.success(COPY.admin.wordAdded);
      setNewWord('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : COPY.errors.generic);
    }
  };

  const handleBanWord = async () => {
    if (!banWordInput.trim()) {
      toast.error(COPY.admin.enterWord);
      return;
    }
    try {
      await banWordMutation.mutateAsync(banWordInput.trim());
      toast.success(COPY.admin.wordBanned);
      setBanWordInput('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : COPY.errors.generic);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: '/menu' })}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{COPY.admin.title}</h1>
            <p className="text-muted-foreground">{COPY.admin.subtitle}</p>
          </div>
        </div>

        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metrics">{COPY.admin.metrics}</TabsTrigger>
            <TabsTrigger value="dictionary">{COPY.admin.dictionary}</TabsTrigger>
            <TabsTrigger value="users">{COPY.admin.users}</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{COPY.admin.totalUsers}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{metrics?.totalUsers.toString() || '0'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{COPY.admin.totalRooms}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{metrics?.totalRooms.toString() || '0'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{COPY.admin.activeRooms}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{metrics?.activeRooms.toString() || '0'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{COPY.admin.bannedUsers}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{metrics?.bannedUsers.toString() || '0'}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dictionary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{COPY.admin.addWord}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newWord">{COPY.admin.wordLabel}</Label>
                  <Input
                    id="newWord"
                    placeholder={COPY.admin.wordPlaceholder}
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                  />
                </div>
                <Button className="gap-2" onClick={handleAddWord} disabled={addWordMutation.isPending}>
                  <Plus className="w-4 h-4" />
                  {COPY.admin.addWordButton}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{COPY.admin.banWord}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="banWord">{COPY.admin.wordLabel}</Label>
                  <Input
                    id="banWord"
                    placeholder={COPY.admin.banWordPlaceholder}
                    value={banWordInput}
                    onChange={(e) => setBanWordInput(e.target.value)}
                  />
                </div>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={handleBanWord}
                  disabled={banWordMutation.isPending}
                >
                  <Ban className="w-4 h-4" />
                  {COPY.admin.banWordButton}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{COPY.admin.userManagement}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{COPY.admin.userManagementDesc}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
