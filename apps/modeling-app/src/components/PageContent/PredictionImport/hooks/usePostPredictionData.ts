import { useState } from 'react';
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
import { assertDataValueSetImportAccepted } from '../utils/dataValueSetImportSummary';
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

export type PredictionImportProgressStep =
    | 'prepareData'
    | 'validateImport'
    | 'validateClear'
    | 'clearPreviousValues'
    | 'importData';

export type PredictionImportProgress = {
    currentStep: PredictionImportProgressStep | null;
    completedSteps: PredictionImportProgressStep[];
    failedStep: PredictionImportProgressStep | null;
};

const initialImportProgress: PredictionImportProgress = {
    currentStep: null,
    completedSteps: [],
    failedStep: null,
};

class ImportAfterClearError extends Error {
    readonly importCause: unknown;

    constructor(cause: unknown) {
        super('Prediction values were cleared, but the new import did not complete.');
        this.name = 'ImportAfterClearError';
        this.importCause = cause;
    }
}

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
    const [progress, setProgress] = useState<PredictionImportProgress>(initialImportProgress);
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

    const runProgressStep = async <T>(
        step: PredictionImportProgressStep,
        action: () => Promise<T>,
    ): Promise<T> => {
        setProgress(current => ({
            ...current,
            currentStep: step,
            failedStep: null,
            completedSteps: current.completedSteps.filter(completedStep => completedStep !== step),
        }));

        try {
            const result = await action();
            setProgress(current => ({
                ...current,
                currentStep: current.currentStep === step ? null : current.currentStep,
                completedSteps: current.completedSteps.includes(step)
                    ? current.completedSteps
                    : [...current.completedSteps, step],
            }));
            return result;
        } catch (error) {
            setProgress(current => ({
                ...current,
                currentStep: current.currentStep === step ? null : current.currentStep,
                failedStep: step,
            }));
            throw error;
        }
    };

    const completeProgressStep = (step: PredictionImportProgressStep) => {
        setProgress(current => ({
            ...current,
            completedSteps: current.completedSteps.includes(step)
                ? current.completedSteps
                : [...current.completedSteps, step],
        }));
    };

    const mutation = useMutation<unknown, Error, PostPredictionDataVariables>({
        mutationFn: async (variables: PostPredictionDataVariables) => {
            setProgress(initialImportProgress);

            const {
                prediction,
                quantileMapping,
                outbreakIndicators,
                clearPreviousValues,
                fallbackOrgUnitIds,
            } = variables;

            const { dataValues, predictionEntries } = await runProgressStep(
                'prepareData',
                async () => {
                    const queryKey = ['predictionEntries', prediction.id, STANDARD_QUANTILES];
                    const cachedPredictionEntries = queryClient.getQueryData<PredictionEntry[]>(queryKey);

                    const predictionEntries = cachedPredictionEntries
                        ?? await PredictionsService.getPredictionEntriesV1AnalyticsPredictionEntryPredictionIdGet(
                            prediction.id,
                            STANDARD_QUANTILES,
                        );

                    return {
                        predictionEntries,
                        dataValues: [
                            ...transformPredictionEntriesToDataValues(predictionEntries, quantileMapping),
                            ...transformOutbreakIndicatorsToDataValues(
                                outbreakIndicators,
                                quantileMapping.outbreakIndicatorId,
                            ),
                        ],
                    };
                },
            );

            await runProgressStep(
                'validateImport',
                async () => assertDataValueSetImportAccepted(
                    await mutateDataValueSet(dataValues, { dryRun: true }),
                    { allowIgnored: false },
                ),
            );

            if (clearPreviousValues) {
                const clearDataValues = await runProgressStep(
                    'validateClear',
                    async () => {
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
                            assertDataValueSetImportAccepted(
                                await mutateDataValueSet(clearDataValues, {
                                    importStrategy: 'DELETE',
                                    dryRun: true,
                                }),
                                { allowIgnored: true },
                            );
                        }

                        return clearDataValues;
                    },
                );

                if (clearDataValues.length) {
                    await runProgressStep(
                        'clearPreviousValues',
                        async () => assertDataValueSetImportAccepted(
                            await mutateDataValueSet(clearDataValues, {
                                importStrategy: 'DELETE',
                            }),
                            { allowIgnored: true },
                        ),
                    );
                } else {
                    completeProgressStep('clearPreviousValues');
                }
            }

            try {
                return await runProgressStep(
                    'importData',
                    async () => {
                        const result = await mutateDataValueSet(dataValues);
                        assertDataValueSetImportAccepted(result, { allowIgnored: false });
                        return result;
                    },
                );
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
        reset: () => {
            mutation.reset();
            setProgress(initialImportProgress);
        },
        progress,
    };
};
