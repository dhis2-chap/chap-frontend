import { useQuery } from '@tanstack/react-query';
import { ApiError, VisualizationsService } from '@dhis2-chap/ui';

export type FacetCoordinates = {
    split_period?: string[];
    location?: string[];
    horizon_distance?: number[];
};

type UseFacetCoordinatesParams = {
    backtestId?: number;
    visualizationName?: string;
};

export const useFacetCoordinates = ({
    backtestId,
    visualizationName,
}: UseFacetCoordinatesParams) => {
    const { data, isLoading, isFetching, error } = useQuery<FacetCoordinates, ApiError>({
        queryKey: [
            'facet-coordinates',
            backtestId,
            visualizationName,
        ],
        queryFn: () =>
            VisualizationsService.getFacetCoordinatesV1VisualizationBacktestPlotsVisualizationNameBacktestIdFacetCoordsGet(
                visualizationName!,
                Number(backtestId),
            ),
        enabled:
            typeof backtestId === 'number' &&
            backtestId > 0 &&
            !!visualizationName,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
        refetchOnWindowFocus: false,
    });

    return {
        facetCoordinates: data,
        isLoading,
        isFetching,
        error,
    };
};
