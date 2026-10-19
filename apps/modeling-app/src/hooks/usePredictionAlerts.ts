import { useDataEngine } from '@dhis2/app-runtime';
import { useQueries, useQuery } from '@tanstack/react-query';
import { AlertsService, OpenAPI } from '@dhis2-chap/ui';
import { useAlertPolicies } from './useAlertPolicies';
import { alertPolicyDisplayQuery } from './useAlertPolicyDisplay';
import { displayPredictionAlerts } from '@/components/BackendAlerts/displayPredictionAlerts';

export const usePredictionAlerts = (predictionId: number) => {
    const engine = useDataEngine();
    const alerts = useQuery({
        queryKey: ['prediction-alerts', OpenAPI.BASE, predictionId],
        queryFn: () => AlertsService.listAlertsV1CrudAlertsGet(undefined, predictionId),
    });
    const policies = useAlertPolicies();
    const policyIds = [...new Set(alerts.data?.map(alert => alert.alertPolicyId) ?? [])];
    const displays = useQueries({ queries: policyIds.map(id => alertPolicyDisplayQuery(engine, id)) });
    return {
        ...alerts,
        displayedAlerts: displayPredictionAlerts(
            alerts.data ?? [],
            policies.data ?? [],
            new Map(policyIds.map((id, index) => [id, displays[index].data])),
        ),
        displayError: policies.error || displays.find(display => display.error)?.error,
    };
};
