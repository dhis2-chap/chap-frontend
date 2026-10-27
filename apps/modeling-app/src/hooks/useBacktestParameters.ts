import { ApiError, BacktestParameterInfo, BacktestsService, useRoute } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { Features, useIsFeatureAvailable } from './useIsFeatureAvailable';
import { useWeatherProviders } from './useWeatherProviders';
import { parseSupportedPeriodType, SUPPORTED_PERIOD_TYPES } from '../utils/supportedPeriodType';

/** CHAP Core stores separate weekly and monthly defaults, and falls back to monthly for anything else. */
const toParameterPeriodType = (periodType: string | null | undefined) => (
    parseSupportedPeriodType(periodType) === SUPPORTED_PERIOD_TYPES.WEEK ? 'week' : 'month'
);

/** Older CHAP Core versions apply their own defaults, so the form leaves the parameters out. */
export const useBacktestParameters = (periodType?: string | null) => {
    const { route } = useRoute();
    const { isAvailable } = useIsFeatureAvailable(Features.BACKTEST_PARAMETERS);
    const parameterPeriodType = toParameterPeriodType(periodType);
    const query = useQuery<BacktestParameterInfo[], ApiError>({
        queryKey: ['backtest-parameters', route?.url, parameterPeriodType],
        queryFn: () => BacktestsService.listBacktestParametersV1AnalyticsBacktestParametersGet(parameterPeriodType),
        staleTime: Infinity,
        keepPreviousData: true,
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
