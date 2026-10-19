import { useQuery } from '@tanstack/react-query';
import { AlertsService, OpenAPI, type PredictionInfo } from '@dhis2-chap/ui';
import { useAlertPolicies } from './useAlertPolicies';
import { useAlertPolicyDisplays } from './useAlertPolicyDisplay';
import { usePredictionSetup } from './usePredictionSetup';
import { displayPredictionAlerts } from '@/components/BackendAlerts/displayPredictionAlerts';
import { getPredictionAlertStatus } from '@/components/BackendAlerts/predictionAlertStatus';

export const usePredictionAlerts = (prediction: PredictionInfo) => {
    const alerts = useQuery({
        queryKey: ['prediction-alerts', OpenAPI.BASE, prediction.id],
        queryFn: () => AlertsService.listAlertsV1CrudAlertsGet(undefined, prediction.id),
    });
    const policies = useAlertPolicies();
    const policyIds = [...new Set(alerts.data?.map(alert => alert.alertPolicyId) ?? [])];
    const displays = useAlertPolicyDisplays();
    const setupId = prediction.predictionSetupId ?? undefined;
    const setup = usePredictionSetup(setupId);
    const setupPolicy = setupId === undefined ? null : setup.predictionSetup && (setup.predictionSetup.alertPolicy ?? null);
    return {
        ...alerts,
        isLoading: alerts.isLoading || (setupId !== undefined && setup.isLoading),
        displayedAlerts: displayPredictionAlerts(
            alerts.data ?? [],
            policies.data ?? [],
            new Map(policyIds.map(id => [id, displays.data?.[id]])),
        ),
        status: getPredictionAlertStatus({
            alerts: alerts.data ?? [],
            policies: policies.data ?? [],
            setupPolicy,
        }),
        displayError: policies.error || displays.error,
    };
};
