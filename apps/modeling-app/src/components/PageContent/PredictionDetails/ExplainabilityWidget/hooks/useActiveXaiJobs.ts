import { useQuery } from '@tanstack/react-query';
import { JobsService } from '@dhis2-chap/ui';
import { JOB_TYPES } from '@/hooks/useJobs';

type Args = {
    predictionId: number;
    xaiMethod: string;
    enabled: boolean;
};

const matches =
    (predictionId: number, xaiMethod: string) =>
        (job: { predictionId?: number | null; xaiMethod?: string | null }) =>
            job.predictionId === predictionId && job.xaiMethod === xaiMethod;

export const useActiveXaiJobs = ({
    predictionId,
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

    const matchFn = matches(predictionId, xaiMethod);

    return {
        explanationJobMatch: explanationJobsQuery.data?.find(matchFn) ?? null,
        surrogateJobMatch: surrogateJobsQuery.data?.find(matchFn) ?? null,
        // True while the initial fetch is in flight, false once we know whether
        // anything is running.
        isCheckingForActiveJobs:
            enabled && explanationJobsQuery.data === undefined,
    };
};
