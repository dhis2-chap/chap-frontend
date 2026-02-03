import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, MetricInfo, VisualizationService } from '@dhis2-chap/ui';

type Props = {
    evaluationId?: number;
};

export const useMetricsForBacktest = ({ evaluationId }: Props) => {
    const { data, error, isLoading } = useQuery<MetricInfo[], ApiError>({
        queryKey: ['visualization-metrics', evaluationId],
        queryFn: () =>
            VisualizationService.getAvailableMetricsVisualizationMetricsBacktestIdGet(
                Number(evaluationId),
            ),
        enabled: typeof evaluationId === 'number' && evaluationId > 0,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    useEffect(() => {
        if (!error) return;
        console.error('useMetricsForBacktest: error loading metrics', {
            message: error?.message,
            error,
            evaluationId,
        });
    }, [error, evaluationId]);

    return {
        metrics: data,
        error,
        isLoading,
    };
};
