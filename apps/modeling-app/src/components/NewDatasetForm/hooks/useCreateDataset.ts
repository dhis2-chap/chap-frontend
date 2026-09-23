import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDataEngine } from '@dhis2/app-runtime';
import { ApiError, DatasetsService, JobsService } from '@dhis2-chap/ui';
import { prepareDataset } from '../utils/prepareDataset';
import { getImportSummaryFromApiError } from '../../ModelExecutionForm/utils/importSummaryUtils';
import type { ImportSummaryCorrected } from '../../ModelExecutionForm/types';
import { type DatasetFormValues } from './useDatasetFormState';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

const FINISHED_JOB_STATUSES = ['SUCCESS', 'FAILURE', 'REVOKED'];

export type DatasetImportSummary = ImportSummaryCorrected & { orgUnitNames: Map<string, string> };

/**
 * Builds the dataset from DHIS2 analytics, hands it to CHAP and follows the resulting import job.
 * CHAP's summary of the locations it left out is kept, including when it rejects all of them.
 */
export const useCreateDataset = (periodSettings: Dhis2PeriodSettings) => {
    const dataEngine = useDataEngine();
    const queryClient = useQueryClient();
    const [jobId, setJobId] = useState<string>();
    const [summary, setSummary] = useState<DatasetImportSummary>();

    const createDataset = useMutation<string, Error | ApiError, DatasetFormValues>({
        onMutate: () => setSummary(undefined),
        mutationFn: async (formData) => {
            const { request, orgUnits } = await prepareDataset(formData, dataEngine, periodSettings);
            const orgUnitNames = new Map(orgUnits.map(orgUnit => [orgUnit.id, orgUnit.displayName]));
            try {
                const response = await DatasetsService.makeDatasetV1AnalyticsMakeDatasetPost(request);
                setSummary({ ...(response as unknown as ImportSummaryCorrected), orgUnitNames });
                if (!response.id) {
                    throw new Error(i18n.t('Dataset import was rejected'));
                }
                return response.id;
            } catch (error) {
                const rejectedSummary = error instanceof ApiError ? getImportSummaryFromApiError(error) : null;
                if (rejectedSummary) {
                    setSummary({ ...rejectedSummary, orgUnitNames });
                }
                throw error;
            }
        },
        onSuccess: (id) => {
            setJobId(id);
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
    });

    const job = useQuery({
        queryKey: ['datasetJob', jobId],
        queryFn: () => JobsService.getJobStatusV1JobsJobIdGet(jobId as string),
        enabled: !!jobId,
        refetchInterval: status => (FINISHED_JOB_STATUSES.includes(status ?? '') ? false : 2000),
        onSuccess: (status) => {
            if (status === 'SUCCESS') {
                queryClient.invalidateQueries({ queryKey: ['datasets'] });
            }
        },
    });

    return {
        createDataset: createDataset.mutate,
        isSubmitting: createDataset.isLoading,
        error: createDataset.error,
        summary,
        isImporting: !!jobId && !FINISHED_JOB_STATUSES.includes(job.data ?? ''),
        hasFailed: job.data === 'FAILURE' || job.data === 'REVOKED',
        hasSucceeded: job.data === 'SUCCESS',
        retry: () => {
            setJobId(undefined);
            setSummary(undefined);
            createDataset.reset();
        },
    };
};
