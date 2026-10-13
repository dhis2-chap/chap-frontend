import { useQuery } from '@tanstack/react-query';
import { AlertApproval, AlertPoliciesService, AlertsService, PredictionsService } from '@dhis2-chap/ui';
import { summarizePredictionReviews } from '../utils/reviewData';

// Only used to order levels by severity, so a failure leaves them unordered rather than failing the page.
const useAlertPolicies = (enabled: boolean) => useQuery({
    queryKey: ['alert-policies'],
    queryFn: () => AlertPoliciesService.listAlertPoliciesV1CrudAlertPoliciesGet(),
    retry: false,
    enabled,
});

export const usePredictionReviews = (enabled: boolean) => {
    const alerts = useQuery({
        queryKey: ['alerts', 'pending'],
        queryFn: () => AlertsService.listAlertsV1CrudAlertsGet(undefined, undefined, undefined, AlertApproval.PENDING),
        enabled,
    });
    const predictions = useQuery({
        queryKey: ['predictions'],
        queryFn: () => PredictionsService.getPredictionsV1CrudPredictionsGet(),
        enabled,
    });
    const policies = useAlertPolicies(enabled);
    return {
        reviews: summarizePredictionReviews(alerts.data ?? [], predictions.data ?? [], policies.data ?? []),
        isLoading: alerts.isLoading || predictions.isLoading || policies.isLoading,
        error: alerts.error || predictions.error,
    };
};

export const usePendingPredictionAlerts = (predictionId: number) => {
    const enabled = Number.isSafeInteger(predictionId) && predictionId > 0;
    const prediction = useQuery({
        queryKey: ['predictions', predictionId],
        queryFn: () => PredictionsService.getPredictionV1CrudPredictionsPredictionIdGet(predictionId),
        enabled,
    });
    const alerts = useQuery({
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
