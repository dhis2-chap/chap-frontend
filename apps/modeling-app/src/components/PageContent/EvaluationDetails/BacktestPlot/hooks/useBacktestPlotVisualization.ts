import { useQuery } from '@tanstack/react-query';
import { ApiError, VisualizationService } from '@dhis2-chap/ui';

type UseBacktestPlotVisualizationParams = {
    evaluationId?: number;
    visualizationId?: string;
};

export const useBacktestPlotVisualization = ({
    evaluationId,
    visualizationId,
}: UseBacktestPlotVisualizationParams) => {
    const { data, isLoading, isFetching, error } = useQuery<unknown, ApiError>({
        queryKey: [
            'backtest-plot-visualization',
            evaluationId,
            visualizationId,
        ],
        queryFn: () =>
            VisualizationService.generateBacktestPlotsVisualizationBacktestPlotsVisualizationNameBacktestIdGet(
                visualizationId!,
                Number(evaluationId),
            ),
        enabled:
            typeof evaluationId === 'number' &&
            evaluationId > 0 &&
            !!visualizationId,
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
