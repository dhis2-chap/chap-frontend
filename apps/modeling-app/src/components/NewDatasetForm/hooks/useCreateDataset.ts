import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDataEngine } from '@dhis2/app-runtime';
import { ApiError, DatasetsService, JobsService } from '@dhis2-chap/ui';
import { prepareDataset } from '../utils/prepareDataset';
import { type DatasetFormValues } from './useDatasetFormState';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

const FINISHED_JOB_STATUSES = ['SUCCESS', 'FAILURE', 'REVOKED'];

/**
 * Builds the dataset from DHIS2 analytics, hands it to CHAP and follows the resulting import job.
 */
export const useCreateDataset = (periodSettings: Dhis2PeriodSettings) => {
    const dataEngine = useDataEngine();
    const queryClient = useQueryClient();
    const [jobId, setJobId] = useState<string>();

    const createDataset = useMutation<string, Error | ApiError, DatasetFormValues>({
        mutationFn: async (formData) => {
            const request = await prepareDataset(formData, dataEngine, periodSettings);
            const { id } = await DatasetsService.makeDatasetV1AnalyticsMakeDatasetPost(request);
            if (!id) {
                throw new Error(i18n.t('Dataset import was rejected'));
            }
            return id;
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
        isImporting: !!jobId && !FINISHED_JOB_STATUSES.includes(job.data ?? ''),
        hasFailed: job.data === 'FAILURE' || job.data === 'REVOKED',
        hasSucceeded: job.data === 'SUCCESS',
        retry: () => {
            setJobId(undefined);
            createDataset.reset();
        },
    };
};
