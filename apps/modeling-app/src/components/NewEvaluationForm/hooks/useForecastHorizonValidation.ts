import { useQueries } from '@tanstack/react-query';
import type { ModelSpecRead } from '@dhis2-chap/ui';
import { configuredModelInfoQueryOptions } from '@/hooks/modelsQuery';
import { getForecastHorizonError } from './forecastHorizon';

export const useForecastHorizonValidation = (models: ModelSpecRead[], nPeriods: number | undefined) => {
    const queries = useQueries({
        queries: models.map(model => configuredModelInfoQueryOptions(model.id)),
    });
    const messages = queries.flatMap((query) => {
        const message = query.data && getForecastHorizonError(query.data, nPeriods);
        return message ? [message] : [];
    });
    const isLoading = queries.some(query => query.isLoading);
    // A failed refresh keeps the cached limits, so only block when nothing was loaded.
    const error = queries.find(query => query.isError && !query.data)?.error;

    return {
        messages,
        isLoading,
        error,
        isBlocked: isLoading || !!error || messages.length > 0,
        retry: () => queries.filter(query => query.isError).forEach(query => void query.refetch()),
    };
};
