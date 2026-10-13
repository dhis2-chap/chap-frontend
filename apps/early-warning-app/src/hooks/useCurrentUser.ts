import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery } from '@tanstack/react-query';

type CurrentUser = { username: string; displayName: string };
export const useCurrentUser = () => {
    const engine = useDataEngine();
    const query = useQuery<CurrentUser, Error>({
        queryKey: ['early-warning', 'current-user'],
        queryFn: async () => {
            const response = await engine.query({ me: {
                resource: 'me', params: { fields: 'username,displayName' },
            } });
            return response.me as CurrentUser;
        },
        staleTime: Infinity,
    });
    return {
        username: query.data?.username,
        displayName: query.data?.displayName,
        isLoading: query.isLoading,
        error: query.error,
    };
};
