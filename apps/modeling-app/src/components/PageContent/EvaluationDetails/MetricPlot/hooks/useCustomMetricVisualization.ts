import { useQuery } from '@tanstack/react-query';
import { ApiError, VisualizationService } from '@dhis2-chap/ui';

type UseVisualizationParams = {
    evaluationId?: number;
    visualizationId?: string;
    metricId?: string;
};

export const useCustomMetricVisualization = ({
    evaluationId,
    visualizationId,
    metricId,
}: UseVisualizationParams) => {
    const { data, isLoading, isFetching, error } = useQuery<unknown, ApiError>({
        queryKey: [
            'custom-metric-visualizations',
            evaluationId,
            visualizationId,
            metricId,
        ],
        queryFn: () =>
            VisualizationService.generateVisualizationVisualizationMetricPlotsVisualizationNameBacktestIdMetricIdGet(
                visualizationId!,
                Number(evaluationId),
                metricId!,
            ),
        enabled:
            typeof evaluationId === 'number' &&
            evaluationId > 0 &&
            !!visualizationId &&
            !!metricId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
        refetchOnWindowFocus: false,
    });

    return {
        visualization: data,
        isLoading,
        isFetching,
        error,
    };
};
