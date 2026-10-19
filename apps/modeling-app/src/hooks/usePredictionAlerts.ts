import { useQuery } from '@tanstack/react-query';
import { AlertsService, OpenAPI } from '@dhis2-chap/ui';
import { useAlertPolicies } from './useAlertPolicies';
import { useAlertPolicyDisplays } from './useAlertPolicyDisplay';
import { displayPredictionAlerts } from '@/components/BackendAlerts/displayPredictionAlerts';

export const usePredictionAlerts = (predictionId: number) => {
    const alerts = useQuery({
        queryKey: ['prediction-alerts', OpenAPI.BASE, predictionId],
        queryFn: () => AlertsService.listAlertsV1CrudAlertsGet(undefined, predictionId),
    });
    const policies = useAlertPolicies();
    const policyIds = [...new Set(alerts.data?.map(alert => alert.alertPolicyId) ?? [])];
    const displays = useAlertPolicyDisplays();
    return {
        ...alerts,
        displayedAlerts: displayPredictionAlerts(
            alerts.data ?? [],
            policies.data ?? [],
            new Map(policyIds.map(id => [id, displays.data?.[id]])),
        ),
        displayError: policies.error || displays.error,
    };
};
