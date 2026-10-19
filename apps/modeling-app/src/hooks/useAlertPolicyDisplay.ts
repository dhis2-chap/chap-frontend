import { useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { OpenAPI } from '@dhis2-chap/ui';
import { alertPolicyDisplaySchema, type AlertPolicyDisplay } from '@/components/BackendAlerts/alertLevelDisplay';

// Presentation belongs to this DHIS2 instance; group it by CHAP server, then by policy id.
const RESOURCE = 'dataStore/modeling/alert-policy-display';
const QUERY_KEY = ['alert-policy-display'];
const storedSchema = z.record(z.record(alertPolicyDisplaySchema));
type StoredDisplays = z.infer<typeof storedSchema>;

const fetchStoredDisplays = async (engine: ReturnType<typeof useDataEngine>): Promise<StoredDisplays> => {
    try {
        const result = await engine.query({ displays: { resource: RESOURCE } });
        return storedSchema.parse(result.displays);
    } catch (error) {
        if ((error as { details?: { httpStatusCode?: number } })?.details?.httpStatusCode === 404) return {};
        throw error;
    }
};

const useServerDisplays = <T>(select: (displays: Record<string, AlertPolicyDisplay>) => T) => {
    const engine = useDataEngine();
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => fetchStoredDisplays(engine),
        select: stored => select(stored[OpenAPI.BASE] ?? {}),
        retry: false,
    });
};

export const useAlertPolicyDisplays = () => useServerDisplays(displays => displays);

export const useAlertPolicyDisplay = (policyId: number) => useServerDisplays(displays => displays[policyId]);

export const useSaveAlertPolicyDisplay = () => {
    const engine = useDataEngine();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ policyId, display }: { policyId: number; display: AlertPolicyDisplay }) => {
            const stored = await fetchStoredDisplays(engine);
            const next = {
                ...stored,
                [OpenAPI.BASE]: { ...stored[OpenAPI.BASE], [policyId]: alertPolicyDisplaySchema.parse(display) },
            };
            await engine.mutate({ resource: RESOURCE, type: 'update', id: '', data: next });
            return next;
        },
        onSuccess: (next) => {
            queryClient.setQueryData(QUERY_KEY, next);
        },
    });
};
