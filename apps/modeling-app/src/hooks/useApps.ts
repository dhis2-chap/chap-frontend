import { useApiDataQuery } from '../utils/useApiDataQuery';

type App = {
    key: string;
    displayName: string;
    version: string;
    pluginLaunchUrl: string;
};

type UseAppsOptions = {
    enabled?: boolean;
    select?: (apps: App[]) => App[];
};

export const useApps = ({
    enabled = true,
    select,
}: UseAppsOptions = {}) => {
    const { data: apps, isLoading, error } = useApiDataQuery<App[]>({
        queryKey: ['apps'],
        query: {
            resource: 'apps',
            params: {
                fields: 'key,displayName,version,pluginLaunchUrl',
            },
        },
        cacheTime: Infinity,
        staleTime: Infinity,
        enabled,
        select,
    });

    return {
        apps,
        isLoading,
        error,
    };
};
