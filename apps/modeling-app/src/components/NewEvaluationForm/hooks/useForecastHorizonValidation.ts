import { useQueries } from '@tanstack/react-query';
import { ModelsService, type ModelSpecRead } from '@dhis2-chap/ui';
import { getForecastHorizonError } from './forecastHorizon';

export const useForecastHorizonValidation = (models: ModelSpecRead[], nPeriods: number | undefined) => {
    const queries = useQueries({
        queries: models.map(model => ({
            queryKey: ['configuredModelInfo', model.id],
            queryFn: () => ModelsService.getConfiguredModelInfoV1CrudConfiguredModelsConfiguredModelIdGet(model.id),
            staleTime: 300000,
            cacheTime: 300000,
            retry: false,
        })),
    });
    const messages = queries.flatMap((query) => {
        const message = query.data && getForecastHorizonError(query.data, nPeriods);
        return message ? [message] : [];
    });
    const isLoading = queries.some(query => query.isLoading);
    const error = queries.find(query => query.isError)?.error;

    return {
        messages,
        isLoading,
        error,
        isBlocked: isLoading || !!error || messages.length > 0,
        retry: () => queries.filter(query => query.isError).forEach(query => void query.refetch()),
    };
};
