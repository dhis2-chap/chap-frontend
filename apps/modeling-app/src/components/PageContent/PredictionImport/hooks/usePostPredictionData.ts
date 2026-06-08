import i18n from '@dhis2/d2-i18n';
import { useAlert, useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    OutbreakIndicator,
    PredictionEntry,
    PredictionInfo,
    PredictionsService,
} from '@dhis2-chap/ui';
import { getPredictionPeriodIds } from '@/utils/predictionRunMetadata';
import {
    buildClearDataValues,
    deduplicateIds,
    getSelectedOutputDataElementIds,
    STANDARD_QUANTILES,
    transformOutbreakIndicatorsToDataValues,
    transformPredictionEntriesToDataValues,
    type PredictionClearDataValue,
    type PredictionDataValue,
    type QuantileMapping,
} from '../utils/predictionImportDataValues';
import { useDhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

type PostPredictionDataVariables = {
    prediction: PredictionInfo;
    quantileMapping: QuantileMapping;
    outbreakIndicators: OutbreakIndicator[];
    clearPreviousValues: boolean;
    fallbackOrgUnitIds: string[];
};

type UsePostPredictionDataOptions = {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
};

class ImportAfterClearError extends Error {
    readonly importCause: unknown;

    constructor(cause: unknown) {
        super('Prediction values were cleared, but the new import did not complete.');
        this.name = 'ImportAfterClearError';
        this.importCause = cause;
    }
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    !!value && typeof value === 'object' && !Array.isArray(value)
);

const getResponseRecord = (result: unknown): Record<string, unknown> | undefined => {
    if (!isRecord(result)) {
        return undefined;
    }

    return isRecord(result.response) ? result.response : result;
};

const getImportCountRecord = (
    response: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined => {
    if (!response) {
        return undefined;
    }

    if (isRecord(response.importCount)) {
        return response.importCount;
    }

    if (isRecord(response.dataValueCount)) {
        return response.dataValueCount;
    }

    return undefined;
};

const getCount = (
    count: Record<string, unknown> | undefined,
    key: string,
): number => {
    const value = count?.[key];
    return typeof value === 'number' ? value : 0;
};

const hasConflicts = (response: Record<string, unknown> | undefined): boolean => {
    const conflicts = response?.conflicts ?? response?.importConflicts;
    return Array.isArray(conflicts) && conflicts.length > 0;
};

const assertDataValueSetImportAccepted = (
    result: unknown,
    { allowIgnored }: { allowIgnored: boolean },
) => {
    const response = getResponseRecord(result);
    const count = getImportCountRecord(response);
    const status = response?.status;

    if (status === 'ERROR') {
        throw new Error('DHIS2 rejected the data value import.');
    }

    if (!allowIgnored && hasConflicts(response)) {
        throw new Error('DHIS2 reported conflicts while importing data values.');
    }

    if (!allowIgnored && getCount(count, 'ignored') > 0) {
        throw new Error('DHIS2 ignored one or more data values.');
    }
};

const getOrgUnitIdsForClear = (
    prediction: PredictionInfo,
    fallbackOrgUnitIds: string[],
    predictionEntries: PredictionEntry[],
): string[] => {
    if (prediction.orgUnits?.length) {
        return deduplicateIds(prediction.orgUnits);
    }

    if (fallbackOrgUnitIds.length) {
        return deduplicateIds(fallbackOrgUnitIds);
    }

    return deduplicateIds(predictionEntries.map(entry => entry.orgUnit));
};

const getForecastPeriodIds = (
    prediction: PredictionInfo,
    predictionEntries: PredictionEntry[],
): string[] => {
    const entryPeriodIds = deduplicateIds(predictionEntries.map(entry => entry.period));
    return entryPeriodIds.length ? entryPeriodIds : getPredictionPeriodIds(prediction);
};

export const usePostPredictionData = ({ onSuccess, onError }: UsePostPredictionDataOptions = {}) => {
    const dataEngine = useDataEngine();
    const queryClient = useQueryClient();
    const { settings: periodSettings } = useDhis2PeriodSettings();
    const { show: showErrorAlert } = useAlert(i18n.t('Failed to post prediction data'), { critical: true });
    const { show: showImportAfterClearErrorAlert } = useAlert(
        i18n.t('Previous values may have been cleared, but the new import did not complete'),
        { critical: true },
    );
    const { show: showSuccessAlert } = useAlert(i18n.t('Prediction data posted successfully'), { success: true });

    const mutateDataValueSet = async (
        dataValues: Array<PredictionDataValue | PredictionClearDataValue>,
        params?: Record<string, string | boolean>,
    ) => dataEngine.mutate({
        resource: 'dataValueSets',
        type: 'create' as const,
        params,
        data: {
            dataValues,
        },
    });

    const mutation = useMutation<unknown, Error, PostPredictionDataVariables>({
        mutationFn: async (variables: PostPredictionDataVariables) => {
            const {
                prediction,
                quantileMapping,
                outbreakIndicators,
                clearPreviousValues,
                fallbackOrgUnitIds,
            } = variables;

            const queryKey = ['predictionEntries', prediction.id, STANDARD_QUANTILES];
            const cachedPredictionEntries = queryClient.getQueryData<PredictionEntry[]>(queryKey);

            const predictionEntries = cachedPredictionEntries
                ?? await PredictionsService.getPredictionEntriesV1AnalyticsPredictionEntryPredictionIdGet(
                    prediction.id,
                    STANDARD_QUANTILES,
                );

            const dataValues = [
                ...transformPredictionEntriesToDataValues(predictionEntries, quantileMapping),
                ...transformOutbreakIndicatorsToDataValues(
                    outbreakIndicators,
                    quantileMapping.outbreakIndicatorId,
                ),
            ];

            assertDataValueSetImportAccepted(
                await mutateDataValueSet(dataValues, { dryRun: true }),
                { allowIgnored: false },
            );

            if (clearPreviousValues) {
                const clearDataValues = buildClearDataValues({
                    dataElementIds: getSelectedOutputDataElementIds(quantileMapping),
                    orgUnitIds: getOrgUnitIdsForClear(
                        prediction,
                        fallbackOrgUnitIds,
                        predictionEntries,
                    ),
                    forecastPeriodIds: getForecastPeriodIds(prediction, predictionEntries),
                    periodType: prediction.dataset?.periodType,
                    calendar: periodSettings.calendar,
                    locale: periodSettings.locale,
                });

                if (clearDataValues.length) {
                    const clearParams = {
                        importStrategy: 'DELETE',
                    };

                    assertDataValueSetImportAccepted(
                        await mutateDataValueSet(clearDataValues, {
                            ...clearParams,
                            dryRun: true,
                        }),
                        { allowIgnored: true },
                    );

                    assertDataValueSetImportAccepted(
                        await mutateDataValueSet(clearDataValues, clearParams),
                        { allowIgnored: true },
                    );
                }
            }

            try {
                const result = await mutateDataValueSet(dataValues);
                assertDataValueSetImportAccepted(result, { allowIgnored: false });
                return result;
            } catch (error) {
                if (clearPreviousValues) {
                    throw new ImportAfterClearError(error);
                }

                throw error;
            }
        },
        onSuccess: () => {
            showSuccessAlert();
            onSuccess?.();
        },
        onError: (error: Error) => {
            if (error instanceof ImportAfterClearError) {
                showImportAfterClearErrorAlert();
            } else {
                showErrorAlert();
            }
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
