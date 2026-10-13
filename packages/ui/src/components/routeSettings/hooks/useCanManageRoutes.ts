import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery } from '@tanstack/react-query';

const ROUTE_AUTHORITIES = ['ALL', 'F_ROUTE_PRIVATE_ADD', 'F_ROUTE_PUBLIC_ADD'];

export const useCanManageRoutes = () => {
    const dataEngine = useDataEngine();
    const { data, isLoading } = useQuery({
        queryKey: ['me', 'authorities'],
        queryFn: async () => {
            const response = await dataEngine.query({ me: { resource: 'me', params: { fields: 'authorities' } } });
            return response.me as { authorities: string[] };
        },
        staleTime: Infinity,
        cacheTime: Infinity,
        refetchOnWindowFocus: false,
    });

    return {
        canManageRoutes: data?.authorities.some(authority => ROUTE_AUTHORITIES.includes(authority)),
        isLoading,
    };
};
