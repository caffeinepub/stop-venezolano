import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfileView } from '../backend';

export function useCurrentUser() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfileView | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  const isAuthenticated = !!identity;

  return {
    userProfile: query.data,
    isAuthenticated,
    profileLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
    displayName: query.data?.name || 'Player',
    shortPrincipal: identity?.getPrincipal().toString().slice(0, 8) || '',
    isAdmin: false, // Will be set by admin hook
  };
}
