import { useQuery } from '@tanstack/react-query';
import { ApiError, BacktestsService, type SelectionBias } from '@dhis2-chap/ui';
import { Features, useIsFeatureAvailable } from '../../hooks/useIsFeatureAvailable';

export type SelectionBiasResult = SelectionBias & {
    /** The evaluation has too few splits to score every period ahead, so only forecasts one period ahead were scored. */
    isFirstHorizonOnly: boolean;
};

const readSelectionBias = (specificationId: number, metricId?: string, horizonDistance?: number) => (
    BacktestsService.getBacktestSpecificationSelectionBiasV1CrudBacktestSpecificationsSpecificationIdSelectionBiasGet(specificationId, metricId, undefined, horizonDistance)
);

/**
 * How much of the lead of the best model in an evaluation is luck. Chap Core draws the splits
 * of the evaluation again and again and sees which model comes out best each time; no model is
 * run again. Scoring every period ahead takes more splits than a default evaluation has, so the
 * estimate falls back to forecasts one period ahead.
 */
export const useSelectionBias = (specificationId: number, metricId: string | undefined, modelCount: number) => {
    const { isAvailable } = useIsFeatureAvailable(Features.SELECTION_BIAS);
    return useQuery<SelectionBiasResult, ApiError>({
        // Under the specifications, so it is read again when a model finishes.
        queryKey: ['backtest-specifications', specificationId, 'selection-bias', metricId ?? null],
        queryFn: async () => {
            try {
                return { ...await readSelectionBias(specificationId, metricId), isFirstHorizonOnly: false };
            } catch (error) {
                if (!(error instanceof ApiError) || error.status !== 422) throw error;
                return { ...await readSelectionBias(specificationId, metricId, 1), isFirstHorizonOnly: true };
            }
        },
        // There is nothing to pick between with a single model.
        enabled: isAvailable && modelCount > 1,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
};
