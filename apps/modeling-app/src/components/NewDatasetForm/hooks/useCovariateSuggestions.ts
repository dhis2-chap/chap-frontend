import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, CovariateNameSuggestion, DatasetsService, ModelSpecRead } from '@dhis2-chap/ui';
import { getRequiredCovariates } from '../utils/datasetModels';

export type CovariateSuggestion = {
    name: string;
    /** Models that read a column with this name. */
    models: ModelSpecRead[];
};

/**
 * Column names to offer, from CHAP's covariate-name suggestions plus the names the configured
 * models read. The model names alone still work on CHAP versions without the suggestion endpoint.
 */
export const useCovariateSuggestions = (models: ModelSpecRead[] = []) => {
    const { data, isLoading } = useQuery<CovariateNameSuggestion[], ApiError>({
        queryKey: ['covariateNames'],
        queryFn: () => DatasetsService.getCovariateNamesV1AnalyticsCovariateNamesGet(),
        staleTime: 5 * 60 * 1000,
        retry: 0,
    });

    const suggestions = useMemo(() => {
        const names = new Set([
            ...(data ?? []).map(suggestion => suggestion.name),
            ...models.flatMap(getRequiredCovariates),
        ]);
        return [...names]
            .map(name => ({ name, models: models.filter(model => getRequiredCovariates(model).includes(name)) }))
            .sort((a, b) => b.models.length - a.models.length || a.name.localeCompare(b.name));
    }, [data, models]);

    return { suggestions, isLoading };
};
