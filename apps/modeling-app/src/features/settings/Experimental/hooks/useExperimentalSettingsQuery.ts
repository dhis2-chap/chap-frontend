import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery } from '@tanstack/react-query';
import {
    ExperimentalSettings,
    ExperimentalSettingsSchema,
    QUERY_KEY,
    DATASTORE_RESOURCE,
} from './useExperimentalSettings';

export const useExperimentalSettingsQuery = () => {
    const engine = useDataEngine();

    return useQuery<ExperimentalSettings | null>({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            try {
                const response = await engine.query({
                    experimental: {
                        resource: DATASTORE_RESOURCE,
                    },
                });
                return ExperimentalSettingsSchema.parse(response.experimental);
            } catch (error: unknown) {
                // If the key doesn't exist (404), return null
                if (error && typeof error === 'object' && 'details' in error) {
                    const details = (error as { details?: { httpStatusCode?: number } }).details;
                    if (details?.httpStatusCode === 404) {
                        return null;
                    }
                }
                throw error;
            }
        },
    });
};
