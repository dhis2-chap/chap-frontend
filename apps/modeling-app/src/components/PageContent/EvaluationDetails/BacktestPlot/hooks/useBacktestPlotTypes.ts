import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, BackTestPlotType, VisualizationService } from '@dhis2-chap/ui';

export const useBacktestPlotTypes = () => {
    const { data, error, isLoading } = useQuery<BackTestPlotType[], ApiError>({
        queryKey: ['backtest-plot-types'],
        queryFn: () => VisualizationService.listBacktestPlotTypesVisualizationBacktestPlotsGet(),
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    useEffect(() => {
        if (!error) return;
        console.error('useBacktestPlotTypes: error loading backtest plot types', {
            message: error?.message,
            error,
        });
    }, [error]);

    return {
        backtestPlotTypes: data,
        error,
        isLoading,
    };
};
