import { useQuery } from '@tanstack/react-query';
import { AlertsService, PredictionsService } from '@dhis2-chap/ui';
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
    return {
        reviews: summarizePredictionReviews(alerts.data ?? [], predictions.data ?? []),
        isLoading: alerts.isLoading || predictions.isLoading,
        error: alerts.error || predictions.error,
    };
};
