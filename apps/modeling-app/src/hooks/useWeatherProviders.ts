import { ApiError, BacktestsService, WeatherProviderInfo, useRoute } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { Features, useIsFeatureAvailable } from './useIsFeatureAvailable';

export const useWeatherProviders = () => {
    const { route } = useRoute();
    const { isAvailable } = useIsFeatureAvailable(Features.BACKTEST_PARAMETERS);
    return useQuery<WeatherProviderInfo[], ApiError>({
        queryKey: ['weather-providers', route?.url],
        queryFn: () => BacktestsService.listFutureWeatherProvidersV1AnalyticsWeatherProvidersGet(),
        staleTime: Infinity,
        retry: false,
        enabled: isAvailable,
    });
};
