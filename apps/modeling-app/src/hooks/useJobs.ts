import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { JobDescription, JobsService, ApiError } from '@dhis2-chap/ui';

export const JOB_STATUSES = {
    SUCCESS: 'SUCCESS',
    PENDING: 'PENDING',
    STARTED: 'STARTED',
    FAILED: 'FAILURE',
    REVOKED: 'REVOKED',
} as const;

export const JOB_TYPES = {
    BACKTEST: 'create_backtest',
    CREATE_BACKTEST_WITH_DATA: 'create_backtest_from_data',
    MAKE_PREDICTION: 'create_prediction',
    CREATE_DATASET: 'create_dataset',
} as const;

// This hook should fetch all jobs and start polling if jobs contains any PENDING or STARTED jobs.
// It should stop polling when all jobs are in a terminal state (SUCCESS, FAILED, CANCELLED).
// The polling should be done every 5 seconds. When a job is updated, the hook should update the job in the jobs array.
// The hook should return all jobs, including the active ones, but the active ones should be updated if there are changes.
export const useJobs = () => {
    const queryClient = useQueryClient();

    const { data: jobs, error, isLoading } = useQuery<JobDescription[], ApiError>({
        queryKey: ['jobs'],
        queryFn: () => JobsService.listJobsJobsGet(),
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    const activeJobIds = useMemo(() => new Set(
        jobs
            ?.filter(job => job.status === JOB_STATUSES.PENDING || job.status === JOB_STATUSES.STARTED)
            .map(job => job.id) ?? [],
    ), [jobs]);

    const { data: activeJobsData } = useQuery<JobDescription[], ApiError>({
        queryKey: ['jobs', 'active'],
        queryFn: () => JobsService.listJobsJobsGet(
            Array.from(activeJobIds),
        ),
        refetchInterval: () => {
            if (activeJobIds.size > 0) {
                return 5000;
            }
            return false;
        },
        enabled: activeJobIds.size > 0,
    });

    useEffect(() => {
        if (!activeJobsData?.length) {
            return;
        }
        let statusChanged = false;

        queryClient.setQueryData(['jobs'], (oldJobs: JobDescription[] | undefined) => {
            return oldJobs?.map((job) => {
                if (activeJobIds.has(job.id)) {
                    const pulledJob = activeJobsData.find(activeJob => activeJob.id === job.id);

                    // check if status has changed and if so, return the pulled job
                    if (pulledJob && pulledJob.status !== job.status) {
                        statusChanged = true;
                        return pulledJob;
                    }
                }
                return job;
            });
        });

        if (statusChanged) {
            queryClient.invalidateQueries({ queryKey: ['backtests'] });
            queryClient.invalidateQueries({ queryKey: ['predictions'] });
        }
    }, [activeJobsData]);

    return {
        jobs,
        error,
        isLoading,
    };
};
