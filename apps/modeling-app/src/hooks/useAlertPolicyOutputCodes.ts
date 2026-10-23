import { useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AlertPolicyRead } from '@dhis2-chap/ui';
import {
    alertPolicyOutputCodesSchema,
    getDefaultAlertPolicyOutputCodes,
    type AlertPolicyOutputCodes,
} from '@/components/BackendAlerts/alertPolicyOutputCodes';

const QUERY_KEY = ['alert-policy-output-codes'];
const getResource = (policyId: number) => `dataStore/modeling/alert-policy-output-codes-${policyId}`;
const isNotFound = (error: unknown) => (error as { details?: { httpStatusCode?: number } })?.details?.httpStatusCode === 404;

export const useAlertPolicyOutputCodes = (policy?: AlertPolicyRead | null) => {
    const engine = useDataEngine();
    return useQuery({
        queryKey: [...QUERY_KEY, policy?.id],
        enabled: !!policy,
        queryFn: async () => {
            if (!policy) throw new Error('An alert policy is required');
            try {
                const result = await engine.query({ codes: { resource: getResource(policy.id) } });
                const codes = alertPolicyOutputCodesSchema.parse(result.codes);
                if (policy.levels?.some(level => !Object.prototype.hasOwnProperty.call(codes.levels, level.name))) {
                    throw new Error('Missing output codes for alert policy levels');
                }
                return codes;
            } catch (error) {
                if (isNotFound(error)) return getDefaultAlertPolicyOutputCodes(policy);
                throw error;
            }
        },
    });
};

export const useSaveAlertPolicyOutputCodes = () => {
    const engine = useDataEngine();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ policyId, codes }: { policyId: number; codes: AlertPolicyOutputCodes }) => {
            const data = alertPolicyOutputCodesSchema.parse(codes);
            const mutate = (type: 'create' | 'update') => engine.mutate({
                resource: getResource(policyId), type, data,
            } as Parameters<typeof engine.mutate>[0]);
            await mutate('update').catch((error) => {
                if (!isNotFound(error)) throw error;
                return mutate('create');
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    });
};
