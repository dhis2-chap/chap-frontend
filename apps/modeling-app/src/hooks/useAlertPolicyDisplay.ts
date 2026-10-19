import { useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertPolicyDisplaySchema, type AlertPolicyDisplay } from '@/components/BackendAlerts/alertLevelDisplay';

// Each policy has its own key, so saving one policy never overwrites another's colours.
const getResource = (policyId: number) => `dataStore/modeling/alert-policy-display-${policyId}`;
const QUERY_KEY = ['alert-policy-display'];

// Resolves to undefined when the policy has no saved colours.
const fetchDisplay = async (engine: ReturnType<typeof useDataEngine>, policyId: number): Promise<AlertPolicyDisplay | undefined> => {
    try {
        const result = await engine.query({ display: { resource: getResource(policyId) } });
        return alertPolicyDisplaySchema.parse(result.display);
    } catch (error) {
        if ((error as { details?: { httpStatusCode?: number } })?.details?.httpStatusCode === 404) return undefined;
        throw error;
    }
};

export const useAlertPolicyDisplay = (policyId: number) => {
    const engine = useDataEngine();
    return useQuery({
        queryKey: [...QUERY_KEY, policyId],
        queryFn: () => fetchDisplay(engine, policyId),
    });
};

export const useAlertPolicyDisplays = (policyIds: number[]) => {
    const engine = useDataEngine();
    return useQuery({
        queryKey: [...QUERY_KEY, policyIds],
        queryFn: async () => Object.fromEntries(await Promise.all(
            policyIds.map(async policyId => [policyId, await fetchDisplay(engine, policyId)] as const),
        )),
    });
};

export const useSaveAlertPolicyDisplay = () => {
    const engine = useDataEngine();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ policyId, display }: { policyId: number; display: AlertPolicyDisplay }) => {
            // Older DHIS2 versions only create a missing key with POST.
            const type = await fetchDisplay(engine, policyId) ? 'update' : 'create';
            await engine.mutate({
                resource: getResource(policyId),
                type,
                data: alertPolicyDisplaySchema.parse(display),
            } as Parameters<typeof engine.mutate>[0]);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    });
};
