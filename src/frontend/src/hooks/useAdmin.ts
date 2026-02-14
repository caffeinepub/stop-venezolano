import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserId } from '../backend';

export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMetrics() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMetrics();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddWord() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (word: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addWord(word);
    },
  });
}

export function useBanWord() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (word: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.banWord(word);
    },
  });
}

export function useBanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: UserId) => {
      if (!actor) throw new Error('Actor not available');
      await actor.banUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

export function useUnbanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: UserId) => {
      if (!actor) throw new Error('Actor not available');
      await actor.unbanUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}
