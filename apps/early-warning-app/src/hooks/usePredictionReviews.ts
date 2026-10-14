import { useQuery } from '@tanstack/react-query';
import {
    AlertApproval,
    AlertsService,
    PredictionsService,
    type AlertRead,
    type ApiError,
    type PredictionInfo,
} from '@dhis2-chap/ui';
import { summarizePredictionReviews } from '../utils/reviewData';
import { useAlertPolicies } from './useAlertPolicies';

export const usePredictionReviews = (enabled: boolean) => {
    const alerts = useQuery<AlertRead[], ApiError>({
        queryKey: ['alerts', 'pending'],
        queryFn: () => AlertsService.listAlertsV1CrudAlertsGet(undefined, undefined, undefined, AlertApproval.PENDING),
        enabled,
    });
    const predictions = useQuery<PredictionInfo[], ApiError>({
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
