import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, VisualizationInfo, VisualizationsService } from '@dhis2-chap/ui';

type Props = {
    evaluationId?: number;
};

export const useMetricVisualizationTypes = ({ evaluationId }: Props) => {
    const { data, error, isLoading } = useQuery<VisualizationInfo[], ApiError>({
        queryKey: ['metric-visualization-types', evaluationId],
        queryFn: () => VisualizationsService.getAvilableMetricPlotsV1VisualizationMetricPlotsBacktestIdGet(
            evaluationId!,
        ),
        enabled: typeof evaluationId === 'number' && evaluationId > 0,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    useEffect(() => {
        if (!error) return;
        console.error('useMetricVisualizationTypes: error loading visualization types', {
            message: error?.message,
            error,
            evaluationId,
        });
    }, [error, evaluationId]);

    return {
        visualizationTypes: data,
        error,
        isLoading,
    };
};
