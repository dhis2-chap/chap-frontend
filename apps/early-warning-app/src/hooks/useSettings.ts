import { useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { useCurrentUser } from './useCurrentUser';
import { getDefaultSettings, normalizeSettings, SETTINGS_KEY, SETTINGS_NAMESPACE, type Settings } from '../utils/settings';

const queryKey = ['early-warning', 'settings'];
const resource = `dataStore/${SETTINGS_NAMESPACE}`;
export const useSettings = () => {
    const engine = useDataEngine();
    return useQuery<Settings & { exists: boolean }, Error>({
        queryKey,
        queryFn: async () => {
            try {
                const response = await engine.query({ settings: { resource, id: SETTINGS_KEY } });
                return { ...normalizeSettings(response.settings as Partial<Settings>), exists: true };
            } catch (error) {
                if ((error as { details?: { httpStatusCode?: number } }).details?.httpStatusCode === 404) {
                    return { ...getDefaultSettings(), exists: false };
                }
                throw error;
            }
        },
    });
};
export const useSaveSettings = () => {
    const engine = useDataEngine();
    const client = useQueryClient();
    const { canApprove } = useCurrentUser();
    return useMutation({
        mutationFn: async ({ settings, exists }: { settings: Settings; exists: boolean }) => {
            if (!canApprove) throw new Error(i18n.t('Review permission is required to change settings.'));
            return engine.mutate(exists
                ? { resource, id: SETTINGS_KEY, type: 'update', data: settings }
                : { resource: `${resource}/${SETTINGS_KEY}`, type: 'create', data: settings });
        },
        onSuccess: () => client.invalidateQueries(queryKey),
    });
};
