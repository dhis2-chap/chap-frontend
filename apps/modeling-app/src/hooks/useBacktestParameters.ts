import { ApiError, BacktestParameterInfo, BacktestsService } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { Features, useIsFeatureAvailable } from './useIsFeatureAvailable';
import { useWeatherProviders } from './useWeatherProviders';

/** Older CHAP Core versions apply their own defaults, so the form leaves the parameters out. */
export const useBacktestParameters = () => {
    const { isAvailable } = useIsFeatureAvailable(Features.BACKTEST_PARAMETERS);
    const query = useQuery<BacktestParameterInfo[], ApiError>({
        queryKey: ['backtest-parameters'],
        queryFn: () => BacktestsService.listBacktestParametersV1AnalyticsBacktestParametersGet(),
        staleTime: Infinity,
        retry: false,
        enabled: isAvailable,
    });
    return { ...query, isAvailable };
};

/** Stored backtest parameters, labelled by CHAP Core. */
export const useBacktestParameterValues = (values: Record<string, unknown>) => {
    const { data: parameters } = useBacktestParameters();
    const { data: providers } = useWeatherProviders();
    return (parameters ?? []).map(({ name, label }) => {
        const value = values[name] as string | number | null | undefined;
        const provider = name === 'futureWeatherProvider' ? providers?.find(item => item.id === value) : undefined;
        return { label, value: provider?.displayName ?? value };
    });
};
