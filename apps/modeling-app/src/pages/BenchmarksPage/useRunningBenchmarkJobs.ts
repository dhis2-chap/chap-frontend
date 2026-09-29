import { useQueries } from '@tanstack/react-query';
import { JobDescription, JobsService, MakeBacktestsRequest } from '@dhis2-chap/ui';
import { JOB_STATUSES, JOB_TYPES, useJobs } from '../../hooks/useJobs';

export type RunningBenchmarkJob = {
    job: JobDescription;
    request: Partial<MakeBacktestsRequest>;
};

const isRunningEvaluation = (job: JobDescription) => job.type === JOB_TYPES.BACKTEST &&
    (job.status === JOB_STATUSES.PENDING || job.status === JOB_STATUSES.STARTED);

/**
 * Running evaluation jobs with their submitted request. Jobs do not say which benchmark they
 * belong to, but the request carries the dataset and backtest parameters that identify it.
 */
export const useRunningBenchmarkJobs = (): RunningBenchmarkJob[] => {
    const { jobs } = useJobs();
    const running = jobs?.filter(isRunningEvaluation) ?? [];
    const requests = useQueries({
        queries: running.map(job => ({
            queryKey: ['job-request', job.id],
            queryFn: () => JobsService.getJobRequestV1JobsJobIdRequestGet(job.id) as Promise<Partial<MakeBacktestsRequest>>,
            staleTime: Infinity,
            retry: 0,
        })),
    });
    return running.flatMap((job, index) => {
        const request = requests[index]?.data;
        return request ? [{ job, request }] : [];
    });
};
