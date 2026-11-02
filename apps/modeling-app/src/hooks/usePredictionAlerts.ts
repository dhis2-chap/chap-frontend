import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertsService, OpenAPI, type PredictionInfo } from '@dhis2-chap/ui';
import { useAlertPolicies } from './useAlertPolicies';
import { useAlertPolicyDisplays } from './useAlertPolicyDisplay';
import { Features, useIsFeatureAvailable } from './useIsFeatureAvailable';
import { displayPredictionAlerts } from '@/components/BackendAlerts/displayPredictionAlerts';
import { getPredictionAlertStatus } from '@/components/BackendAlerts/predictionAlertStatus';

export const usePredictionAlerts = (prediction: PredictionInfo, enabled: boolean) => {
    const alerts = useQuery({
        queryKey: ['prediction-alerts', OpenAPI.BASE, prediction.id],
        queryFn: () => AlertsService.listAlertsV1CrudAlertsGet(undefined, prediction.id),
        enabled,
    });
    const policies = useAlertPolicies();
    const { isAvailable: isPolicyRecorded, isLoading: isVersionLoading } = useIsFeatureAvailable(Features.PREDICTION_ALERT_POLICY);
    const policyId = isPolicyRecorded ? prediction.alertPolicyId ?? null : undefined;
    const displays = useAlertPolicyDisplays([...new Set(alerts.data?.map(alert => alert.alertPolicyId))].sort((a, b) => a - b));
    // Keep a stable reference so the memoised plot tiles only re-render when alerts change.
    const displayedAlerts = useMemo(
        () => displayPredictionAlerts(alerts.data ?? [], policies.data ?? [], displays.data ?? {}),
        [alerts.data, policies.data, displays.data],
    );
    const status = useMemo(() => getPredictionAlertStatus({
        alerts: alerts.data ?? [],
        policies: policies.data ?? [],
        policyId,
    }), [alerts.data, policies.data, policyId]);
    return {
        ...alerts,
        isLoading: alerts.isLoading || policies.isLoading || isVersionLoading,
        displayedAlerts,
        status,
        displayError: policies.error || displays.error,
    };
};
