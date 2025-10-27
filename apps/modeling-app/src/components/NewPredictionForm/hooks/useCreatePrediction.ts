import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataEngine } from '@dhis2/app-runtime';
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

type Props = {
    onSuccess?: () => void;
    onError?: (error: ApiError) => void;
};

export const useCreatePrediction = ({ onSuccess, onError }: Props = {}) => {
    const dataEngine = useDataEngine();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

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
            };

            return AnalyticsService.makePredictionAnalyticsMakePredictionPost(predictionRequest);
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
