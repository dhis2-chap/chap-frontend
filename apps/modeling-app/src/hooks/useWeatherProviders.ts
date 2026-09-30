import { ApiError, BacktestsService, WeatherProviderInfo } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';

export const useWeatherProviders = () => useQuery<WeatherProviderInfo[], ApiError>({
    queryKey: ['weather-providers'],
    queryFn: () => BacktestsService.listFutureWeatherProvidersV1AnalyticsWeatherProvidersGet(),
    staleTime: Infinity,
    retry: false,
});
