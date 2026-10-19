import { useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { alertPolicyDisplaySchema, type AlertPolicyDisplay } from '@/components/BackendAlerts/alertLevelDisplay';

// Colours for every policy are stored under one key, by policy id.
const RESOURCE = 'dataStore/modeling/alert-policy-display';
const QUERY_KEY = ['alert-policy-display'];
const storedSchema = z.record(alertPolicyDisplaySchema);
type StoredDisplays = z.infer<typeof storedSchema>;

// Resolves to undefined when the key has not been created yet.
const fetchStoredDisplays = async (engine: ReturnType<typeof useDataEngine>): Promise<StoredDisplays | undefined> => {
    try {
        const result = await engine.query({ displays: { resource: RESOURCE } });
        return storedSchema.parse(result.displays);
    } catch (error) {
        if ((error as { details?: { httpStatusCode?: number } })?.details?.httpStatusCode === 404) return undefined;
        throw error;
    }
};

const useStoredDisplays = <T>(select: (displays: StoredDisplays) => T) => {
    const engine = useDataEngine();
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => fetchStoredDisplays(engine),
        select: stored => select(stored ?? {}),
        retry: false,
    });
};

export const useAlertPolicyDisplays = () => useStoredDisplays(displays => displays);

export const useAlertPolicyDisplay = (policyId: number) => useStoredDisplays(displays => displays[policyId]);

export const useSaveAlertPolicyDisplay = () => {
    const engine = useDataEngine();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ policyId, display }: { policyId: number; display: AlertPolicyDisplay }) => {
            const stored = await fetchStoredDisplays(engine);
            const next = { ...stored, [policyId]: alertPolicyDisplaySchema.parse(display) };
            // Older DHIS2 versions only create a missing key with POST.
            const type = stored ? 'update' : 'create';
            await engine.mutate({ resource: RESOURCE, type, data: next } as Parameters<typeof engine.mutate>[0]);
            return next;
        },
        onSuccess: (next) => {
            queryClient.setQueryData(QUERY_KEY, next);
        },
    });
};
