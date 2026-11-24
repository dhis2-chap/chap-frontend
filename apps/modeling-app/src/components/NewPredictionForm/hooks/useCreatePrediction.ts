import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataEngine } from '@dhis2/app-runtime';
import { useNavigate } from 'react-router-dom';
import {
    ApiError,
    FeatureCollectionModel,
    JobResponse,
    PredictionSetupsService,
    RunPredictionSetupRequest,
} from '@dhis2-chap/ui';
import { ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { prepareBacktestData } from '../../ModelExecutionForm/utils/prepareBacktestData';
import { buildOrgUnitFeatureCollection } from '../../ModelExecutionForm/utils/orgUnitGeoJson';
import { getImportSummaryFromApiError } from '../../ModelExecutionForm/utils/importSummaryUtils';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import { fetchPredictionPeriods } from '../utils/fetchPredictionPeriods';

type Props = {
    predictionSetupId: number;
    periodSettings: Dhis2PeriodSettings;
    returnTo?: string;
    onSuccess?: () => void;
    onError?: (error: ApiError) => void;
};

export const useCreatePrediction = ({
    predictionSetupId,
    periodSettings,
    returnTo,
    onSuccess,
    onError,
}: Props) => {
    const dataEngine = useDataEngine();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [progress, setProgress] = useState('');
    const [dataHash, setDataHash] = useState<string>();

    const {
        mutate: createPrediction,
        isLoading,
        error,
    } = useMutation<JobResponse, ApiError, ModelExecutionFormValues>({
        mutationFn: async (formData: ModelExecutionFormValues) => {
            setDataHash(undefined);
            setProgress(i18n.t('Preparing data'));
            const nPeriods = await fetchPredictionPeriods(predictionSetupId, formData.periodType);

            const { observations, orgUnitResponse, hash } = await prepareBacktestData(
                formData,
                dataEngine,
                queryClient,
                periodSettings,
                setProgress,
            );

            setDataHash(hash);

            const geojson: FeatureCollectionModel = buildOrgUnitFeatureCollection(
                orgUnitResponse.geojson.organisationUnits,
            );

            const predictionRequest: RunPredictionSetupRequest = {
                name: formData.name,
                geojson,
                providedData: observations,
                nPeriods,
                type: 'prediction',
            };

            setProgress(i18n.t('Starting prediction in Chap'));
            return PredictionSetupsService.runPredictionSetupV1CrudPredictionSetupsPredictionSetupIdRunPost(
                predictionSetupId,
                predictionRequest,
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['predictions'] });
            queryClient.invalidateQueries({ queryKey: ['predictionSetups'] });
            onSuccess?.();
            navigate(returnTo || '/jobs');
        },
        onError: (apiError: ApiError) => {
            onError?.(apiError);
        },
    });

    return {
        createPrediction,
        importSummary: error ? getImportSummaryFromApiError(error, dataHash) : null,
        isSubmitting: isLoading,
        progress,
        error,
    };
};
