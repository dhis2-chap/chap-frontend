import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertPoliciesService, type AlertPolicyCreate, type AlertPolicyRead, type ApiError, type DataBaseResponse } from '@dhis2-chap/ui';

export const ALERT_POLICIES_QUERY_KEY = ['alert-policies'];

export const useAlertPolicies = () => useQuery<AlertPolicyRead[], ApiError>({
    queryKey: ALERT_POLICIES_QUERY_KEY,
    queryFn: () => AlertPoliciesService.listAlertPoliciesV1CrudAlertPoliciesGet(),
    retry: false,
});

export const useCreateAlertPolicy = () => {
    const queryClient = useQueryClient();
    return useMutation<DataBaseResponse, ApiError, AlertPolicyCreate>({
        mutationFn: (policy: AlertPolicyCreate) => AlertPoliciesService.createAlertPolicyV1CrudAlertPoliciesPost(policy),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ALERT_POLICIES_QUERY_KEY }),
    });
};
