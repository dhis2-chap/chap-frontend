import { useQuery } from '@tanstack/react-query';
import { AlertPoliciesService, type AlertPolicyRead, type ApiError } from '@dhis2-chap/ui';

// Not retried: the queue only orders levels by it and tolerates a failure; the forecast review surfaces one.
export const useAlertPolicies = (enabled: boolean) => useQuery<AlertPolicyRead[], ApiError>({
    queryKey: ['alert-policies'],
    queryFn: () => AlertPoliciesService.listAlertPoliciesV1CrudAlertPoliciesGet(),
    retry: false,
    enabled,
});
