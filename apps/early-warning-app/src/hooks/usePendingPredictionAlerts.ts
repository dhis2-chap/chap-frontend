import { useQuery } from '@tanstack/react-query';
import {
    AlertApproval,
    AlertsService,
    PredictionsService,
    type AlertRead,
    type ApiError,
    type PredictionInfo,
} from '@dhis2-chap/ui';
import { useAlertPolicies } from './useAlertPolicies';

export const usePendingPredictionAlerts = (predictionId: number) => {
    const enabled = Number.isSafeInteger(predictionId) && predictionId > 0;
    const prediction = useQuery<PredictionInfo, ApiError>({
        queryKey: ['predictions', predictionId],
        queryFn: () => PredictionsService.getPredictionV1CrudPredictionsPredictionIdGet(predictionId),
        enabled,
    });
    const alerts = useQuery<AlertRead[], ApiError>({
        queryKey: ['alerts', 'pending', predictionId],
        queryFn: () => AlertsService.listAlertsV1CrudAlertsGet(undefined, predictionId, undefined, AlertApproval.PENDING),
        enabled,
    });
    const policies = useAlertPolicies(enabled);
    return {
        prediction: prediction.data,
        alerts: alerts.data ?? [],
        policies: policies.data ?? [],
        isLoading: enabled && (prediction.isLoading || alerts.isLoading || policies.isLoading),
        error: prediction.error || alerts.error,
    };
};
