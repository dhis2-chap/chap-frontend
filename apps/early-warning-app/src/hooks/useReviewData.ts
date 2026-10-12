import { useQuery } from '@tanstack/react-query';
import { AlertsService, PredictionsService } from '@dhis2-chap/ui';

export const useReviewData = (predictionId: number) => {
    const enabled = Number.isSafeInteger(predictionId) && predictionId > 0;
    const prediction = useQuery({
        queryKey: ['prediction', predictionId],
        queryFn: () => PredictionsService.getPredictionV1CrudPredictionsPredictionIdGet(predictionId),
        enabled,
    });
    const alerts = useQuery({
        queryKey: ['alerts', 'prediction', predictionId],
        queryFn: () => AlertsService.listAlertsV1CrudAlertsGet(undefined, predictionId),
        enabled,
    });
    return {
        prediction: prediction.data,
        alerts: alerts.data ?? [],
        isLoading: enabled && (prediction.isLoading || alerts.isLoading),
        error: prediction.error || alerts.error,
    };
};
