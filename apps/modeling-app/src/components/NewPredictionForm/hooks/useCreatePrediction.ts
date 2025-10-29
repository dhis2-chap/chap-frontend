import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataEngine } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { useNavigate } from 'react-router-dom';
import {
    AnalyticsService,
    ApiError,
    FeatureCollectionModel,
    JobResponse,
    MakePredictionRequest,
} from '@dhis2-chap/ui';
import { ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { prepareBacktestData } from '../../ModelExecutionForm/utils/prepareBacktestData';
import { validateClimateData } from '../../ModelExecutionForm/utils/validateClimateData';
import { ImportSummaryCorrected } from '../../ModelExecutionForm/types';
import { PERIOD_TYPES } from '@/components/ModelExecutionForm';

type Props = {
    onSuccess?: () => void;
    onError?: (error: ApiError) => void;
};

export const N_PERIODS = {
    [PERIOD_TYPES.MONTH]: 3,
    [PERIOD_TYPES.WEEK]: 12,
};

export const useCreatePrediction = ({ onSuccess, onError }: Props = {}) => {
    const dataEngine = useDataEngine();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);

    const {
        mutate: validateAndDryRun,
        data: validationResult,
        isPending: isValidationLoading,
        error: validationError,
        reset: resetValidation,
    } = useMutation<ImportSummaryCorrected, ApiError, ModelExecutionFormValues>({
        mutationFn: async (formData: ModelExecutionFormValues) => {
            const {
                observations,
                periods,
                orgUnitIds,
                hash,
            } = await prepareBacktestData(formData, dataEngine, queryClient);

            const validation = validateClimateData(observations, formData, periods, orgUnitIds);

            if (!validation.isValid) {
                const uniqueOrgUnits = [...new Set(validation.missingData.map(item => item.orgUnit))];
                const successCount = orgUnitIds.length - uniqueOrgUnits.length;

                return {
                    id: null,
                    importedCount: successCount,
                    hash,
                    rejected: validation.missingData.map(item => ({
                        featureName: item.covariate,
                        orgUnit: item.orgUnit,
                        reason: i18n.t('Missing data for covariate'),
                        period: [item.period],
                    })),
                };
            }

            return {
                id: null,
                importedCount: orgUnitIds.length,
                rejected: [],
            };
        },
        onSuccess: () => {
            setSummaryModalOpen(true);
        },
        onError: (error: ApiError) => {
            onError?.(error);
        },
    });

    const {
        mutate: createPrediction,
        isPending,
        error,
    } = useMutation<JobResponse, ApiError, ModelExecutionFormValues>({
        mutationFn: async (formData: ModelExecutionFormValues) => {
            const { model, observations, orgUnitResponse, dataSources } = await prepareBacktestData(
                formData,
                dataEngine,
                queryClient,
            );

            const geojson: FeatureCollectionModel = {
                type: 'FeatureCollection',
                features: orgUnitResponse.geojson.organisationUnits.map(ou => ({
                    id: ou.id,
                    type: 'Feature',
                    geometry: ou.geometry,
                    properties: {
                        id: ou.id,
                        parent: ou.parent.id,
                        parentGraph: ou.parent.id,
                        level: ou.level,
                    },
                })),
            };

            const predictionRequest: MakePredictionRequest = {
                name: formData.name,
                geojson,
                providedData: observations,
                dataSources,
                dataToBeFetched: [],
                modelId: model.name,
                nPeriods: N_PERIODS[formData.periodType],
                type: 'forecasting' as const,
            };

            return AnalyticsService.makePredictionAnalyticsMakePredictionPost(predictionRequest);
        },
        onMutate: () => {
            resetValidation();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['predictions'] });
            onSuccess?.();
            navigate('/jobs');
        },
        onError: (apiError: ApiError) => {
            onError?.(apiError);
        },
    });

    return {
        createPrediction,
        validateAndDryRun,
        validationResult,
        isSubmitting: isPending,
        isValidationLoading,
        importSummary: validationResult,
        error: validationError || error,
        summaryModalOpen,
        closeSummaryModal: () => setSummaryModalOpen(false),
    };
};
