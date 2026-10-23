import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertsService, OpenAPI, type PredictionInfo } from '@dhis2-chap/ui';
import { useAlertPolicies } from './useAlertPolicies';
import { useAlertPolicyDisplays } from './useAlertPolicyDisplay';
import { usePredictionSetup } from './usePredictionSetup';
import { displayPredictionAlerts } from '@/components/BackendAlerts/displayPredictionAlerts';
import { getPredictionAlertStatus } from '@/components/BackendAlerts/predictionAlertStatus';

export const usePredictionAlerts = (prediction: PredictionInfo, enabled: boolean) => {
    const alerts = useQuery({
        queryKey: ['prediction-alerts', OpenAPI.BASE, prediction.id],
        queryFn: () => AlertsService.listAlertsV1CrudAlertsGet(undefined, prediction.id),
        enabled,
    });
    const policies = useAlertPolicies();
    const displays = useAlertPolicyDisplays([...new Set(alerts.data?.map(alert => alert.alertPolicyId))].sort((a, b) => a - b));
    const setupId = prediction.predictionSetupId ?? undefined;
    const setup = usePredictionSetup(setupId);
    const setupPolicy = setupId === undefined ? null : setup.predictionSetup && (setup.predictionSetup.alertPolicy ?? null);
    // Keep a stable reference so the memoised plot tiles only re-render when alerts change.
    const displayedAlerts = useMemo(
        () => displayPredictionAlerts(alerts.data ?? [], policies.data ?? [], displays.data ?? {}),
        [alerts.data, policies.data, displays.data],
    );
    const status = useMemo(() => getPredictionAlertStatus({
        alerts: alerts.data ?? [],
        policies: policies.data ?? [],
        setupPolicy,
    }), [alerts.data, policies.data, setupPolicy]);
    return {
        ...alerts,
        isLoading: alerts.isLoading || (setupId !== undefined && setup.isLoading),
        displayedAlerts,
        status,
        displayError: policies.error || displays.error,
    };
};
