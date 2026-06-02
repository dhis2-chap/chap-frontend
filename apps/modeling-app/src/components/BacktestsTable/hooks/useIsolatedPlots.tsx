import { useQuery } from '@tanstack/react-query';
import { ApiError, VisualizationsService } from '@dhis2-chap/ui';

type UseIsolatedPlotsParams = {
    visualizationName?: string;
    backtestId?: number;
    requestBody?: Record<string, any>;
};

export const useIsolatedPlots = ({
    visualizationName,
    backtestId,
    requestBody,
}: UseIsolatedPlotsParams) => {
    const { data, isLoading, isFetching, error } = useQuery<unknown, ApiError>({
        queryKey: [
            'isolated-plots',
            backtestId,
            visualizationName,
            requestBody, // Included in queryKey so changes trigger a refetch
        ],
        queryFn: () =>
            VisualizationsService.generateIsolatedPlotsV1VisualizationBacktestPlotsVisualizationNameBacktestIdSubplotPost(
                visualizationName!,
                Number(backtestId),
                requestBody || {},
            ),
        // Ensures the API isn't called with missing or invalid parameters
        enabled:
            typeof backtestId === 'number' &&
            backtestId > 0 &&
            !!visualizationName &&
            !!requestBody,
        staleTime: 5 * 60 * 1000,
        // Note: In TanStack Query v5+, cacheTime is renamed to gcTime.
        // Keeping cacheTime here to match your existing implementation template.
        cacheTime: 5 * 60 * 1000,
        retry: 0,
        refetchOnWindowFocus: false,
    });

    return {
        plotsData: data,
        isLoading,
        isFetching,
        error,
    };
};
