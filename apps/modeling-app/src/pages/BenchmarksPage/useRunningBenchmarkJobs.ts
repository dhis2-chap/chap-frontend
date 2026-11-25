import { useQueries } from '@tanstack/react-query';
import { JobDescription, JobsService, MakeBacktestsRequest } from '@dhis2-chap/ui';
import { JOB_STATUSES, JOB_TYPES, useJobs } from '../../hooks/useJobs';

export type RunningBenchmarkJob = {
    job: JobDescription;
    request: Partial<MakeBacktestsRequest>;
};

const isRunningEvaluation = (job: JobDescription) => job.type === JOB_TYPES.BACKTEST &&
    (job.status === JOB_STATUSES.PENDING || job.status === JOB_STATUSES.STARTED);

/** Chap Core 2.6 records the parameters a job runs with, including the stored defaults for any the request left out. */
const getResolvedParameters = (job: JobDescription): Partial<MakeBacktestsRequest> => {
    const parameters = job.parameters ?? {};
    return Object.fromEntries(Object.entries({
        nPeriods: parameters.n_periods,
        nSplits: parameters.n_splits,
        stride: parameters.stride,
        nRetrain: parameters.n_retrain,
        futureWeatherProvider: parameters.future_weather_provider,
        // The dataset's saved target when the request left it out.
        targetColumn: parameters.target_column,
    }).filter(([, value]) => value != null));
};

const isFailedEvaluation = (job: JobDescription) => job.type === JOB_TYPES.BACKTEST && job.status === JOB_STATUSES.FAILED;

/**
 * Evaluation jobs with their submitted request. Jobs do not say which benchmark they
 * belong to, but the request carries the dataset and backtest parameters that identify it.
 * A dataset id, where Chap Core records it on the job, saves reading the requests of other data.
 */
const useBenchmarkJobs = (isMatch: (job: JobDescription) => boolean, datasetId?: number): RunningBenchmarkJob[] => {
    const { jobs } = useJobs();
    const matching = jobs?.filter(job => isMatch(job) && (datasetId == null || job.dataset_id == null || job.dataset_id === datasetId)) ?? [];
    const requests = useQueries({
        queries: matching.map(job => ({
            queryKey: ['job-request', job.id],
            queryFn: () => JobsService.getJobRequestV1JobsJobIdRequestGet(job.id) as Promise<Partial<MakeBacktestsRequest>>,
            staleTime: Infinity,
            retry: 0,
        })),
    });
    return matching.flatMap((job, index) => {
        const request = requests[index]?.data;
        return request ? [{ job, request: { ...request, ...getResolvedParameters(job) } }] : [];
    });
};

export const useRunningBenchmarkJobs = () => useBenchmarkJobs(isRunningEvaluation);

/** Evaluation jobs that failed, for one dataset. */
export const useFailedBenchmarkJobs = (datasetId?: number) => useBenchmarkJobs(isFailedEvaluation, datasetId);
