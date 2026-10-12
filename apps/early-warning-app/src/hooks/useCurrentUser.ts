import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery } from '@tanstack/react-query';
import { hasReviewAuthority } from '../utils/settings';

export const APPROVE_AUTHORITY = 'F_CHAP_EARLY_WARNING_APPROVE';
type CurrentUser = { username: string; displayName: string; authorities: string[] };
export const useCurrentUser = () => {
    const engine = useDataEngine();
    const query = useQuery<CurrentUser, Error>({
        queryKey: ['early-warning', 'current-user'],
        queryFn: async () => {
            const response = await engine.query({ me: {
                resource: 'me', params: { fields: 'username,displayName,authorities' },
            } });
            return response.me as CurrentUser;
        },
        staleTime: Infinity,
    });
    return {
        username: query.data?.username,
        displayName: query.data?.displayName,
        canApprove: hasReviewAuthority(query.data?.authorities ?? []),
        isLoading: query.isLoading,
        error: query.error,
    };
};
