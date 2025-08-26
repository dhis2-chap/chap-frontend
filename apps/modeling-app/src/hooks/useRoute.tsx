import { useApiDataQuery } from '../utils/useApiDataQuery'

const RouteRequest = {
    resource: 'routes',
    params: {
        filter: `code:eq:chap`,
        fields: 'id,code,name,displayName,url,authorities,disabled,headers,sharing[public]',
    },
}

export type Route = {
    id: string
    code: string
    name: string
    displayName: string
    url: string
    authorities: string[]
    headers: Record<string, string>
    sharing: {
        public: string,
    }
}

export const useRoute = () => {
    const { data, error, isLoading, isError } = useApiDataQuery<{ routes: Route[] }, Error, Route>({
        queryKey: ['routes', 'chap'],
        query: RouteRequest,
        select: (data) => data.routes[0],
        staleTime: Infinity,
        cacheTime: Infinity,
        refetchOnWindowFocus: false,
    });

    return {
        route: data,
        error,
        isLoading,
        isError,
    }
};
