import i18n from '@dhis2/d2-i18n';
import { useAlert, useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, AnalyticsService, PredictionEntry, QuantileKey } from '@dhis2-chap/ui';

const STANDARD_QUANTILES = [0.1, 0.5, 0.9];

type QuantileMapping = {
    quantileLowId: string;
    quantileMedianId: string;
    quantileHighId: string;
};

type PostPredictionDataVariables = {
    predictionId: number;
    quantileMapping: QuantileMapping;
};

type UsePostPredictionDataOptions = {
    onSuccess?: () => void;
    onError?: (error: ApiError) => void;
};

const QUANTILE_STRINGS = {
    QUANTILE_LOW: 'quantile_low',
    MEDIAN: 'median',
    QUANTILE_HIGH: 'quantile_high',
} as const;

const QUANTILE_MAP: Record<number, QuantileKey> = {
    0.1: QUANTILE_STRINGS.QUANTILE_LOW,
    0.5: QUANTILE_STRINGS.MEDIAN,
    0.9: QUANTILE_STRINGS.QUANTILE_HIGH,
};

const mapQuantileToKey = (quantile: number): QuantileKey | null => QUANTILE_MAP[quantile] ?? null;

/**
 * Maps quantile key to data element ID
 */
const mapQuantileKeyToDataElement = (
    quantileKey: QuantileKey,
    quantileMapping: QuantileMapping,
): string => {
    switch (quantileKey) {
        case QUANTILE_STRINGS.QUANTILE_LOW:
            return quantileMapping.quantileLowId;
        case QUANTILE_STRINGS.MEDIAN:
            return quantileMapping.quantileMedianId;
        case QUANTILE_STRINGS.QUANTILE_HIGH:
            return quantileMapping.quantileHighId;
        default:
            throw new Error(`Unknown quantile key: ${quantileKey}`);
    }
};

/**
 * Transforms PredictionEntry array to dataValueSets format
 */
const transformPredictionEntriesToDataValues = (
    predictionEntries: PredictionEntry[],
    quantileMapping: QuantileMapping,
) => {
    return predictionEntries
        .map((entry) => {
            const quantileKey = mapQuantileToKey(entry.quantile);
            if (!quantileKey) {
                // Skip entries with non-standard quantiles
                return null;
            }

            const dataElementId = mapQuantileKeyToDataElement(quantileKey, quantileMapping);

            return {
                dataElement: dataElementId,
                period: entry.period,
                orgUnit: entry.orgUnit,
                value: entry.value.toString(),
            };
        })
        .filter((value): value is NonNullable<typeof value> => value !== null);
};

export const usePostPredictionData = ({ onSuccess, onError }: UsePostPredictionDataOptions = {}) => {
    const dataEngine = useDataEngine();
    const queryClient = useQueryClient();
    const { show: showErrorAlert } = useAlert(i18n.t('Failed to post prediction data'), { critical: true });
    const { show: showSuccessAlert } = useAlert(i18n.t('Prediction data posted successfully'), { success: true });

    const mutation = useMutation<unknown, ApiError, PostPredictionDataVariables>({
        mutationFn: async (variables: PostPredictionDataVariables) => {
            const { predictionId, quantileMapping } = variables;

            const queryKey = ['predictionEntries', predictionId, STANDARD_QUANTILES];
            const cachedPredictionEntries = queryClient.getQueryData<PredictionEntry[]>(queryKey);

            const predictionEntries = cachedPredictionEntries
                ?? await AnalyticsService.getPredictionEntriesAnalyticsPredictionEntryPredictionIdGet(
                    predictionId,
                    STANDARD_QUANTILES,
                );

            const dataValues = transformPredictionEntriesToDataValues(predictionEntries, quantileMapping);

            const mutationRequest = {
                resource: 'dataValueSets',
                type: 'create' as const,
                data: {
                    dataValues,
                },
            };

            return dataEngine.mutate(mutationRequest);
        },
        onSuccess: () => {
            showSuccessAlert();
            onSuccess?.();
        },
        onError: (error: ApiError) => {
            showErrorAlert();
            console.error('Failed to post prediction data', error);
            onError?.(error);
        },
    });

    return {
        mutate: mutation.mutate,
        mutateAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
        reset: mutation.reset,
    };
};
