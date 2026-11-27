import { useQuery } from '@tanstack/react-query';
import { ApiError, BacktestsService, type SelectionBias } from '@dhis2-chap/ui';
import { Features, useIsFeatureAvailable } from '../../hooks/useIsFeatureAvailable';

/**
 * How much of the lead of the best model in an evaluation is luck. Chap Core draws the splits
 * of the evaluation again and again and sees which model comes out best each time; no model is
 * run again. Every period ahead is scored, as in the scores the models are ranked by, which
 * takes more splits than a default evaluation has; Chap Core then says so instead.
 */
export const useSelectionBias = (specificationId: number, metricId: string | undefined, modelCount: number) => {
    const { isAvailable } = useIsFeatureAvailable(Features.SELECTION_BIAS);
    return useQuery<SelectionBias, ApiError>({
        // Under the specifications, so it is read again when a model finishes.
        queryKey: ['backtest-specifications', specificationId, 'selection-bias', metricId ?? null],
        queryFn: () => BacktestsService.getBacktestSpecificationSelectionBiasV1CrudBacktestSpecificationsSpecificationIdSelectionBiasGet(specificationId, metricId),
        // There is nothing to pick between with a single model.
        enabled: isAvailable && modelCount > 1,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
};
