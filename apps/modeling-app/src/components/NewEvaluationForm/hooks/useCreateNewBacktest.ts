import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { getLegacyBacktestParameters } from './backtestDefaults';
import { BacktestsService, DatasetsService, FeatureCollectionModel, DatasetMakeRequest, ApiError } from '@dhis2-chap/ui';
import { useDataEngine } from '@dhis2/app-runtime';
import { useNavigate } from 'react-router-dom';
import { prepareBacktestData } from '../../ModelExecutionForm/utils/prepareBacktestData';
import { ImportSummaryCorrected } from '../../ModelExecutionForm/types';
import { getImportSummaryFromApiError } from '@/components/ModelExecutionForm/utils/importSummaryUtils';
import { buildOrgUnitFeatureCollection } from '@/components/ModelExecutionForm/utils/orgUnitGeoJson';
import { DEFAULT_PERIOD_SETTINGS, type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import { Features, useIsFeatureAvailable } from '@/hooks/useIsFeatureAvailable';
import { waitForDatasetImport } from '../../NewDatasetForm/utils/waitForDatasetImport';

type Props = {
    periodSettings?: Dhis2PeriodSettings;
    onSuccess?: () => void;
    onError?: (error: ApiError | Error) => void;
};

export const useCreateNewBacktest = ({
    periodSettings = DEFAULT_PERIOD_SETTINGS,
    onSuccess,
    onError,
}: Props = {}) => {
    const dataEngine = useDataEngine();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { isAvailable: supportsMultiModel } = useIsFeatureAvailable(Features.MULTI_MODEL_BACKTESTS);
    const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);
    const [importSummary, setImportSummary] = useState<ImportSummaryCorrected | null>(null);
    const lastImportHashRef = useRef<string | null>(null);

    const buildBacktestRequest = async (formData: ModelExecutionFormValues) => {
        const { model, observations, orgUnitResponse, dataSources, hash } = await prepareBacktestData(
            formData,
            dataEngine,
            queryClient,
            periodSettings,
        );

        const filteredGeoJson: FeatureCollectionModel = buildOrgUnitFeatureCollection(
            orgUnitResponse.geojson.organisationUnits,
        );

        const datasetRequest: DatasetMakeRequest = {
            name: formData.name,
            type: 'evaluation',
            geojson: filteredGeoJson,
            providedData: observations,
            dataSources,
            dataToBeFetched: [],
        };
        const backtestRequest = {
            name: formData.name,
            modelIds: [model.name],
            ...(formData.backtestParameters ?? getLegacyBacktestParameters(formData.periodType)),
        };

        return { datasetRequest, backtestRequest, hash };
    };

    const {
        mutate: validateAndDryRun,
        isLoading: isValidationLoading,
        error: validationError,
        reset: resetValidation,
    } = useMutation<ImportSummaryCorrected, ApiError | Error, ModelExecutionFormValues>({
        onMutate: () => {
            setImportSummary(null);
            setSummaryModalOpen(false);
            queryClient.removeQueries({ queryKey: ['new-backtest-data'] });
        },
        mutationFn: async (formData: ModelExecutionFormValues) => {
            const { datasetRequest, hash } = await buildBacktestRequest(formData);

            try {
                const result = await DatasetsService.makeDatasetV1AnalyticsMakeDatasetPost(
                    datasetRequest,
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
        onError: (error) => {
            onError?.(error);
        },
    });

    const {
        mutate: createNewBacktest,
        isLoading,
        error,
    } = useMutation<void, ApiError | Error, ModelExecutionFormValues>({
        mutationFn: async (formData: ModelExecutionFormValues) => {
            const { datasetRequest, backtestRequest, hash } = await buildBacktestRequest(formData);
            lastImportHashRef.current = hash;

            const result = await DatasetsService.makeDatasetV1AnalyticsMakeDatasetPost(datasetRequest);
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            const datasetId = await waitForDatasetImport(result.id);
            queryClient.invalidateQueries({ queryKey: ['datasets'] });

            if (supportsMultiModel) {
                await BacktestsService.createBacktestsV1AnalyticsCreateBacktestsPost({ ...backtestRequest, datasetId });
            } else {
                // Chap Core < 2.4.0 supports only one model per request.
                const { modelIds, ...parameters } = backtestRequest;
                await BacktestsService.createBacktestV1AnalyticsCreateBacktestPost({
                    ...parameters, datasetId, modelId: modelIds[0],
                });
            }
        },
        onMutate: () => {
            resetValidation();
            setImportSummary(null);
            setSummaryModalOpen(false);
            lastImportHashRef.current = null;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.removeQueries({ queryKey: ['new-backtest-data'] });
            onSuccess?.();
            navigate('/jobs');
        },
        onError: (error) => {
            if (error instanceof ApiError && error.status === 400) {
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
        const { datasetRequest, backtestRequest } = await buildBacktestRequest(formData);
        const blob = new Blob([JSON.stringify({ datasetRequest, backtestRequest }, null, 2)], { type: 'application/json' });
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
        isSubmitting: isLoading,
        isValidationLoading,
        importSummary,
        error: validationError || error,
        summaryModalOpen,
        closeSummaryModal: () => setSummaryModalOpen(false),
    };
};
