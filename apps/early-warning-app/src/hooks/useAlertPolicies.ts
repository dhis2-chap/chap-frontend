import { useQuery } from '@tanstack/react-query';
import { AlertPoliciesService, type AlertPolicyRead, type ApiError } from '@dhis2-chap/ui';

// Only used to order levels by severity, so a failure leaves them unordered rather than failing the page.
export const useAlertPolicies = (enabled: boolean) => useQuery<AlertPolicyRead[], ApiError>({
    queryKey: ['alert-policies'],
    queryFn: () => AlertPoliciesService.listAlertPoliciesV1CrudAlertPoliciesGet(),
    retry: false,
    enabled,
});
