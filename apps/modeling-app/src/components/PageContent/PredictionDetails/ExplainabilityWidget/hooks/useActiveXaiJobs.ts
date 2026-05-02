import { useQuery } from '@tanstack/react-query';
import { JobsService } from '@dhis2-chap/ui';
import { JOB_TYPES } from '@/hooks/useJobs';

type Args = {
    predictionId: number;
    predictionName: string;
    xaiMethod: string;
    enabled: boolean;
};

// Backend names XAI jobs as `${predictionName} ${xaiMethod}`, so we match by
// prediction name rather than id (the id never appears in the job name).
const matches =
    (predictionName: string, xaiMethod: string) => (job: { name: string }) =>
        !!predictionName &&
        job.name.includes(predictionName) &&
        job.name.includes(xaiMethod);

export const useActiveXaiJobs = ({
    predictionId,
    predictionName,
    xaiMethod,
    enabled,
}: Args) => {
    const explanationJobsQuery = useQuery({
        queryKey: ['activeXaiJobs', predictionId, xaiMethod],
        queryFn: () =>
            JobsService.listJobsV1JobsGet(
                undefined,
                ['PENDING', 'STARTED'],
                JOB_TYPES.XAI_EXPLANATIONS,
            ),
        enabled,
        cacheTime: 0,
    });

    const surrogateJobsQuery = useQuery({
        queryKey: ['activeSurrogateJobs', predictionId, xaiMethod],
        queryFn: () =>
            JobsService.listJobsV1JobsGet(
                undefined,
                ['PENDING', 'STARTED'],
                JOB_TYPES.XAI_SURROGATE,
            ),
        enabled,
        cacheTime: 0,
    });

    const matchFn = matches(predictionName, xaiMethod);

    return {
        explanationJobMatch: explanationJobsQuery.data?.find(matchFn) ?? null,
        surrogateJobMatch: surrogateJobsQuery.data?.find(matchFn) ?? null,
        // Equivalent to the old `activeXaiJobs === undefined` check — true while the
        // initial fetch is in flight, false once we know whether anything is running.
        isCheckingForActiveJobs:
            enabled && explanationJobsQuery.data === undefined,
    };
};
