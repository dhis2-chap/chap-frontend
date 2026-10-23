import { useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertPolicyDisplaySchema, type AlertPolicyDisplay } from '../utils/alertLevelDisplay';

// Each policy has its own key, so saving one policy never overwrites another's colours.
const getResource = (policyId: number) => `dataStore/modeling/alert-policy-display-${policyId}`;
const QUERY_KEY = ['alert-policy-display'];

const isNotFound = (error: unknown) => (error as { details?: { httpStatusCode?: number } })?.details?.httpStatusCode === 404;

// Resolves to no colours when the policy has none saved (React Query rejects undefined).
const fetchDisplay = async (engine: ReturnType<typeof useDataEngine>, policyId: number): Promise<AlertPolicyDisplay> => {
    try {
        const result = await engine.query({ display: { resource: getResource(policyId) } });
        return alertPolicyDisplaySchema.parse(result.display);
    } catch (error) {
        if (isNotFound(error)) return {};
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
            const data = alertPolicyDisplaySchema.parse(display);
            const mutate = (type: 'create' | 'update') => engine.mutate(
                { resource: getResource(policyId), type, data } as Parameters<typeof engine.mutate>[0],
            );
            // Overwrite whatever is stored, even if invalid; older DHIS2 versions only create a missing key with POST.
            await mutate('update').catch((error) => {
                if (!isNotFound(error)) throw error;
                return mutate('create');
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    });
};
