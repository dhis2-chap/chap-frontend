import { useQuery } from '@tanstack/react-query';
import { AlertPoliciesService, AlertsService, PredictionsService } from '@dhis2-chap/ui';
import { summarizePredictionReviews } from '../utils/reviewData';

export const usePredictionReviews = () => {
    const alerts = useQuery({
        queryKey: ['alerts'],
        queryFn: () => AlertsService.listAlertsV1CrudAlertsGet(),
    });
    const predictions = useQuery({
        queryKey: ['predictions'],
        queryFn: () => PredictionsService.getPredictionsV1CrudPredictionsGet(),
    });
    // Only used to order levels by severity, so a failure leaves them unordered rather than failing the queue.
    const policies = useQuery({
        queryKey: ['alert-policies'],
        queryFn: () => AlertPoliciesService.listAlertPoliciesV1CrudAlertPoliciesGet(),
        retry: false,
    });
    return {
        reviews: summarizePredictionReviews(alerts.data ?? [], predictions.data ?? [], policies.data ?? []),
        isLoading: alerts.isLoading || predictions.isLoading || policies.isLoading,
        error: alerts.error || predictions.error,
    };
};
