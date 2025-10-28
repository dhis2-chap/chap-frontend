import { useQuery } from '@tanstack/react-query';
import { ApiError, VisualizationService } from '@dhis2-chap/ui';

type UseVisualizationParams = {
    evaluationId?: number;
    visualizationId?: string;
    metricId?: string;
};

export const useCustomVisualization = ({
    evaluationId,
    visualizationId,
    metricId,
}: UseVisualizationParams) => {
    const { data, isLoading, error } = useQuery<unknown, ApiError>({
        queryKey: [
            'custom-visualizations',
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
    });

    return {
        visualization: data,
        isLoading,
        error,
    };
};
