import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataEngine } from '@dhis2/app-runtime';
import { useNavigate } from 'react-router-dom';
import {
    ApiError,
    FeatureCollectionModel,
    JobResponse,
    MakePredictionRequest,
    PredictionsService,
} from '@dhis2-chap/ui';
import { ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { prepareBacktestData } from '../../ModelExecutionForm/utils/prepareBacktestData';
import { PERIOD_TYPES } from '@dhis2-chap/ui';
import { useExperimentalFeature } from '../../../features/settings/Experimental/hooks/useExperimentalFeature';
import { FEATURES } from '../../../features/settings/Experimental/hooks/useExperimentalSettings';
import { buildOrgUnitFeatureCollection } from '../../ModelExecutionForm/utils/orgUnitGeoJson';

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
    const { enabled: xaiAutoTraining } = useExperimentalFeature(FEATURES.XAI_AUTO_TRAINING);

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

            const geojson: FeatureCollectionModel = buildOrgUnitFeatureCollection(
                orgUnitResponse.geojson.organisationUnits,
            );

            const predictionRequest: MakePredictionRequest = {
                name: formData.name,
                geojson,
                providedData: observations,
                dataSources,
                dataToBeFetched: [],
                modelId: model.name,
                nPeriods: N_PERIODS[formData.periodType.toUpperCase() as keyof typeof N_PERIODS],
                type: 'forecasting' as const,
                enableXai: xaiAutoTraining,
            };

            return PredictionsService.makePredictionV1AnalyticsMakePredictionPost(predictionRequest);
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
        isSubmitting: isPending,
        error,
    };
};
