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
import { PERIOD_TYPES } from '@dhis2-chap/core';
import { buildOrgUnitFeatureCollection } from '../../ModelExecutionForm/utils/orgUnitGeoJson';

type Props = {
    predictionSetupId: number;
    returnTo?: string;
    onSuccess?: () => void;
    onError?: (error: ApiError) => void;
};

export const N_PERIODS = {
    [PERIOD_TYPES.MONTH]: 3,
    [PERIOD_TYPES.WEEK]: 12,
};

export const useCreatePrediction = ({
    predictionSetupId,
    returnTo,
    onSuccess,
    onError,
}: Props) => {
    const dataEngine = useDataEngine();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const {
        mutate: createPrediction,
        isPending,
        error,
    } = useMutation<JobResponse, ApiError, ModelExecutionFormValues>({
        mutationFn: async (formData: ModelExecutionFormValues) => {
            const nPeriods = N_PERIODS[formData.periodType.toUpperCase() as keyof typeof N_PERIODS];

            const { observations, orgUnitResponse } = await prepareBacktestData(
                formData,
                dataEngine,
                queryClient,
            );

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
        isSubmitting: isPending,
        error,
    };
};
