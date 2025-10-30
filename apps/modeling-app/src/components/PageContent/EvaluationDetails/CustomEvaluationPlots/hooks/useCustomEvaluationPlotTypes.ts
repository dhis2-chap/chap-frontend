import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, BackTestPlotType, VisualizationService } from '@dhis2-chap/ui';

export const useCustomEvaluationPlotTypes = () => {
    const { data, error, isLoading } = useQuery<BackTestPlotType[], ApiError>({
        queryKey: ['custom-evaluation-plot-types'],
        queryFn: () => VisualizationService.listBacktestPlotTypesVisualizationBacktestPlotsGet(),
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    useEffect(() => {
        if (!error) return;
        console.error('useCustomEvaluationPlotTypes: error loading custom evaluation plot types', {
            message: error?.message,
            error,
        });
    }, [error]);

    return {
        customEvaluationPlotTypes: data,
        error,
        isLoading,
    };
};
