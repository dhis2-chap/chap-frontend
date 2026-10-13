import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery } from '@tanstack/react-query';

export const CHAP_ROUTE_CODE = 'chap';

const RouteRequest = {
    routes: {
        resource: 'routes',
        params: {
            filter: `code:eq:${CHAP_ROUTE_CODE}`,
            fields: 'id,code,name,displayName,url,authorities,disabled,headers,sharing[public],responseTimeoutSeconds',
        },
    },
};

export type Route = {
    id: string;
    code: string;
    name: string;
    displayName: string;
    url: string;
    authorities: string[];
    headers: Record<string, string>;
    sharing: {
        public: string;
    };
    responseTimeoutSeconds?: number;
};

export const useRoute = () => {
    const dataEngine = useDataEngine();
    const { data, error, isLoading, isError } = useQuery<{ routes: Route[] }, Error, Route>({
        queryKey: ['routes', CHAP_ROUTE_CODE],
        queryFn: async () => {
            const response = await dataEngine.query(RouteRequest);
            return response.routes as { routes: Route[] };
        },
        select: data => data.routes[0],
        staleTime: Infinity,
        cacheTime: Infinity,
        refetchOnWindowFocus: false,
    });

    return {
        route: data,
        error,
        isLoading,
        isError,
    };
};
