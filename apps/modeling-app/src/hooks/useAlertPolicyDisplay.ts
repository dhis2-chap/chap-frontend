import { useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OpenAPI } from '@dhis2-chap/ui';
import { alertPolicyDisplaySchema, type AlertPolicyDisplay } from '@/components/BackendAlerts/alertLevelDisplay';

// Presentation belongs to this DHIS2 instance; scope it to the CHAP server too.
const resourceFor = (policyId: number) => `dataStore/modeling/alert-policy-display-${btoa(OpenAPI.BASE).replaceAll('/', '_').replaceAll('+', '-').replaceAll('=', '')}-${policyId}`;
const queryKeyFor = (policyId: number) => ['alert-policy-display', OpenAPI.BASE, policyId];

export const alertPolicyDisplayQuery = (engine: ReturnType<typeof useDataEngine>, policyId: number) => ({
    queryKey: queryKeyFor(policyId),
    queryFn: async () => {
        try {
            const result = await engine.query({ display: { resource: resourceFor(policyId) } });
            return alertPolicyDisplaySchema.parse(result.display);
        } catch (error) {
            if ((error as { details?: { httpStatusCode?: number } })?.details?.httpStatusCode === 404) return {};
            throw error;
        }
    },
    retry: false,
});

export const useAlertPolicyDisplay = (policyId: number) => {
    const engine = useDataEngine();
    return useQuery(alertPolicyDisplayQuery(engine, policyId));
};

export const useSaveAlertPolicyDisplay = () => {
    const engine = useDataEngine();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ policyId, display }: { policyId: number; display: AlertPolicyDisplay }) => engine.mutate({
            resource: resourceFor(policyId),
            type: 'update',
            id: '',
            data: alertPolicyDisplaySchema.parse(display),
        }),
        onSuccess: (_result, { policyId, display }) => {
            queryClient.setQueryData(queryKeyFor(policyId), display);
        },
    });
};
