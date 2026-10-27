import { ApiError, BacktestParameterInfo, BacktestsService, useRoute } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { PERIOD_TYPES } from '@dhis2-chap/core';
import { Features, useIsFeatureAvailable } from './useIsFeatureAvailable';
import { useWeatherProviders } from './useWeatherProviders';

/**
 * Older Chap Core versions apply their own defaults, so the form leaves the parameters out.
 * Chap Core stores separate weekly and monthly defaults; anything else gets the monthly ones.
 */
export const useBacktestParameters = (periodType?: string | null) => {
    const { route } = useRoute();
    const { isAvailable } = useIsFeatureAvailable(Features.BACKTEST_PARAMETERS);
    const period = periodType?.toUpperCase() === PERIOD_TYPES.WEEK ? 'week' : 'month';
    const query = useQuery<BacktestParameterInfo[], ApiError>({
        queryKey: ['backtest-parameters', route?.url, period],
        queryFn: () => BacktestsService.listBacktestParametersV1AnalyticsBacktestParametersGet(period),
        staleTime: Infinity,
        retry: false,
        enabled: isAvailable,
    });
    return { ...query, isAvailable };
};

/** Stored backtest parameters, labelled by Chap Core. */
export const useBacktestParameterValues = (values: Record<string, unknown>) => {
    const { data: parameters } = useBacktestParameters();
    const { data: providers } = useWeatherProviders();
    return (parameters ?? []).map(({ name, label }) => {
        const value = values[name] as string | number | null | undefined;
        const provider = name === 'futureWeatherProvider' ? providers?.find(item => item.id === value) : undefined;
        return { label, value: provider?.displayName ?? value };
    });
};
