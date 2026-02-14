import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { RoomId, GameMode, Category, Submission, UserProfileView, MonthlyScoreView } from '../backend';
import { toast } from 'sonner';

// Room Management
export function useCreateRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mode, categories }: { mode: GameMode; categories: Category[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createRoom(mode, categories);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useJoinRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: RoomId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinRoom(roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useLeaveRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: RoomId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.leaveRoom(roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useStartGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: RoomId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startGame(roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useGetRoom(roomId: RoomId) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['room', roomId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getRoom(roomId);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 2000,
  });
}

export function useGetAvailableRooms() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['availableRooms'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAvailableRooms();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

// Matchmaking
export function useJoinMatchmaking() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinMatchmaking();
    },
  });
}

export function useLeaveMatchmaking() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.leaveMatchmaking();
    },
  });
}

// Round Management
export function useStartRound() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: RoomId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startRound(roomId);
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['matchState', roomId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId.toString()] });
    },
  });
}

export function useStopCurrentRound() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: RoomId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.stopCurrentRound(roomId);
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['matchState', roomId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['validationResults', roomId.toString()] });
    },
  });
}

export function useGetCurrentMatchState(roomId: RoomId) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['matchState', roomId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCurrentMatchState(roomId);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 2000,
  });
}

export function useSubmitWord() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ roomId, category, word }: { roomId: RoomId; category: Category; word: Submission }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitWord(roomId, category, word);
    },
  });
}

export function useGetValidationResults(roomId: RoomId) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['validationResults', roomId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getValidationResults(roomId);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 2000,
  });
}

// User Profile
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfileView | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfileView) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Monthly Leaderboard
export function useGetCurrentMonthLeaderboard() {
  const { actor, isFetching } = useActor();

  return useQuery<MonthlyScoreView[]>({
    queryKey: ['monthlyLeaderboard', 'current'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCurrentMonthLeaderboard();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useGetCurrentTop1() {
  const { actor, isFetching } = useActor();

  return useQuery<MonthlyScoreView | null>({
    queryKey: ['monthlyTop1', 'current'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCurrentTop1();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useGetMyMonthlyScore(month: string) {
  const { actor, isFetching } = useActor();

  return useQuery<MonthlyScoreView | null>({
    queryKey: ['myMonthlyScore', month],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMyMonthlyScore(month);
    },
    enabled: !!actor && !isFetching,
  });
}
