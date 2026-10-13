import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import type { ImportedIndicator } from '../utils/importLedger';

/** The saved targets remain valid if the setup or app mapping changes later. */
export const useImportLedger = (predictionId: number | undefined) => {
    const engine = useDataEngine();
    const client = useQueryClient();
    const resource = 'dataStore/chap-early-warning';
    const id = `prediction-${predictionId}-imports`;
    const queryKey = ['early-warning', 'imports', predictionId];
    const query = useQuery<{ records: ImportedIndicator[]; exists: boolean }, Error>({
        queryKey,
        enabled: predictionId != null,
        queryFn: async () => {
            try {
                const response = await engine.query({ ledger: { resource, id } });
                return { records: response.ledger as ImportedIndicator[], exists: true };
            } catch (error) {
                if ((error as { details?: { httpStatusCode?: number } }).details?.httpStatusCode === 404) return { records: [], exists: false };
                throw error;
            }
        },
    });
    const save = async (records: ImportedIndicator[]) => {
        if (!query.data) throw Error(i18n.t('Import history must be loaded before submitting a review.'));
        await engine.mutate(query.data.exists
            ? { resource, id, type: 'update', data: records }
            : { resource: `${resource}/${id}`, type: 'create', data: records });
        client.setQueryData(queryKey, { records, exists: true });
    };
    return { ...query, save };
};
