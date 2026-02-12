import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import {
    AnalyticsService,
    FeatureCollectionModel,
    MakeBacktestWithDataRequest,
    ApiError,
    PERIOD_TYPES,
} from '@dhis2-chap/ui';
import { useDataEngine } from '@dhis2/app-runtime';
import { useNavigate } from 'react-router-dom';
import { prepareBacktestData } from '../../ModelExecutionForm/utils/prepareBacktestData';
import { ImportSummaryCorrected } from '../../ModelExecutionForm/types';
import { getImportSummaryFromApiError } from '@/components/ModelExecutionForm/utils/importSummaryUtils';

const N_SPLITS = 10;

const N_PERIODS = {
    [PERIOD_TYPES.MONTH]: 3,
    [PERIOD_TYPES.WEEK]: 12,
};

const N_STRIDES = {
    [PERIOD_TYPES.MONTH]: 1,
    [PERIOD_TYPES.WEEK]: 4,
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
    const [importSummary, setImportSummary] = useState<ImportSummaryCorrected | null>(null);
    const lastImportHashRef = useRef<string | null>(null);

    const buildBacktestRequest = async (formData: ModelExecutionFormValues) => {
        const { model, observations, orgUnitResponse, dataSources, hash } = await prepareBacktestData(
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
            nPeriods: N_PERIODS[formData.periodType.toUpperCase() as keyof typeof N_PERIODS],
            nSplits: N_SPLITS,
            stride: N_STRIDES[formData.periodType.toUpperCase() as keyof typeof N_STRIDES],
        };

        return { backtestRequest, hash };
    };

    const {
        mutate: validateAndDryRun,
        isPending: isValidationLoading,
        error: validationError,
        reset: resetValidation,
    } = useMutation<ImportSummaryCorrected, ApiError, ModelExecutionFormValues>({
        onMutate: () => {
            setImportSummary(null);
            setSummaryModalOpen(false);
        },
        mutationFn: async (formData: ModelExecutionFormValues) => {
            const { backtestRequest, hash } = await buildBacktestRequest(formData);

            try {
                const result = await AnalyticsService.createBacktestWithDataAnalyticsCreateBacktestWithDataPost(
                    backtestRequest,
                    true,
                );
                return {
                    ...result,
                    hash,
                } as unknown as ImportSummaryCorrected;
            } catch (error) {
                if (error instanceof ApiError && error.status === 400) {
                    const summary = getImportSummaryFromApiError(error, hash);
                    if (summary) {
                        return summary;
                    }
                }
                throw error;
            }
        },
        onSuccess: (data) => {
            setImportSummary(data);
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
    } = useMutation<ImportSummaryCorrected, ApiError, ModelExecutionFormValues>({
        mutationFn: async (formData: ModelExecutionFormValues) => {
            const { backtestRequest, hash } = await buildBacktestRequest(formData);
            lastImportHashRef.current = hash;

            const result = await AnalyticsService.createBacktestWithDataAnalyticsCreateBacktestWithDataPost(
                backtestRequest,
                false,
            );
            return {
                ...result,
                hash,
            } as unknown as ImportSummaryCorrected;
        },
        onMutate: () => {
            resetValidation();
            setImportSummary(null);
            setSummaryModalOpen(false);
            lastImportHashRef.current = null;
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
            if (error.status === 400) {
                const summary = getImportSummaryFromApiError(error, lastImportHashRef.current || undefined);
                if (summary) {
                    setImportSummary(summary);
                    setSummaryModalOpen(true);
                    return;
                }
            }
            onError?.(error);
        },
    });

    const downloadRequest = async (formData: ModelExecutionFormValues) => {
        const { backtestRequest } = await buildBacktestRequest(formData);
        const blob = new Blob([JSON.stringify(backtestRequest, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.name || 'backtest-request'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return {
        createNewBacktest,
        validateAndDryRun,
        downloadRequest,
        isSubmitting: isPending,
        isValidationLoading,
        importSummary,
        error: validationError || error,
        summaryModalOpen,
        closeSummaryModal: () => setSummaryModalOpen(false),
    };
};
