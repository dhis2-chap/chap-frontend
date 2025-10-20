import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { EvaluationFormValues } from './useFormController';
import {
    AnalyticsService,
    FeatureCollectionModel,
    MakeBacktestWithDataRequest,
    ApiError,
    ImportSummaryResponse,
} from '@dhis2-chap/ui';
import { useDataEngine } from '@dhis2/app-runtime';
import { PERIOD_TYPES } from '../Sections/PeriodSelector';
import { useNavigate } from 'react-router-dom';
import { validateClimateData } from '../utils/validateClimateData';
import { prepareBacktestData } from '../utils/prepareBacktestData';

const N_SPLITS = 10;
const STRIDE = 1;

const N_PERIODS = {
    [PERIOD_TYPES.MONTH]: 3,
    [PERIOD_TYPES.WEEK]: 12,
};

// This is a workaround to get the correct type for the rejected field - the openapi spec is incorrect
export type ImportSummaryCorrected = Omit<ImportSummaryResponse, 'rejected'> & {
    hash?: string;
    rejected: {
        featureName: string;
        orgUnit: string;
        reason: string;
        period: string[];
    }[];
};

type Props = {
    onSuccess?: () => void;
    onError?: (error: ApiError) => void;
};

export const useCreateNewBacktest = ({
    onSuccess,
    onError,
}: Props = {}) => {
    const dataEngine = useDataEngine();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);

    // TODO - remove this once the validation is done in the backend
    const {
        mutate: validateAndDryRun,
        data: validationResult,
        isPending: isValidationLoading,
        error: validationError,
        reset: resetValidation,
    } = useMutation<ImportSummaryCorrected, ApiError, EvaluationFormValues>({
        mutationFn: async (formData: EvaluationFormValues) => {
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
        mutate: createNewBacktest,
        isPending,
        error,
    } = useMutation<ImportSummaryCorrected, ApiError, EvaluationFormValues>({
        mutationFn: async (formData: EvaluationFormValues) => {
            const { model, observations, orgUnitResponse, dataSources } = await prepareBacktestData(
                formData,
                dataEngine,
                queryClient,
            );

            const filteredGeoJson: FeatureCollectionModel = {
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

            const backtestRequest: MakeBacktestWithDataRequest = {
                name: formData.name,
                geojson: filteredGeoJson,
                providedData: observations,
                dataSources,
                dataToBeFetched: [],
                modelId: model.name,
                nPeriods: N_PERIODS[formData.periodType],
                nSplits: N_SPLITS,
                stride: STRIDE,
            };

            return AnalyticsService.createBacktestWithDataAnalyticsCreateBacktestWithDataPost(backtestRequest, false) as unknown as Promise<ImportSummaryCorrected>;
        },
        onMutate: () => {
            resetValidation();
        },
        onSuccess: (data: ImportSummaryCorrected) => {
            if (data.id) {
                queryClient.invalidateQueries({ queryKey: ['jobs'] });
                queryClient.invalidateQueries({ queryKey: ['new-backtest-data'] });
                onSuccess?.();
                navigate('/jobs');
            }
        },
        onError: (error: ApiError) => {
            onError?.(error);
        },
    });

    return {
        createNewBacktest,
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
