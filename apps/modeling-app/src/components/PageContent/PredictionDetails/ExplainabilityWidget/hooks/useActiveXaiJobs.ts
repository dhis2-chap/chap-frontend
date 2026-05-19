import { useQuery } from '@tanstack/react-query';
import { JobsService } from '@dhis2-chap/ui';
import { JOB_TYPES } from '@/hooks/useJobs';

type Args = {
    predictionId: number;
    xaiMethod: string;
    enabled: boolean;
};

const matchesPredictionAndMethod = (predictionId: number, xaiMethod: string) =>
    (job: { predictionId?: number | null; xaiMethod?: string | null }) =>
        job.predictionId === predictionId && job.xaiMethod === xaiMethod;

export const useActiveXaiJobs = ({
    predictionId,
    xaiMethod,
    enabled,
}: Args) => {
    const { data, isFetching } = useQuery({
        queryKey: ['activeXaiJobs', predictionId, xaiMethod],
        queryFn: () =>
            JobsService.listJobsV1JobsGet(
                undefined,
                ['PENDING', 'STARTED'],
                [JOB_TYPES.XAI_EXPLANATIONS, JOB_TYPES.XAI_SURROGATE],
            ),
        enabled,
    });

    const matching = data?.filter(matchesPredictionAndMethod(predictionId, xaiMethod)) ?? [];

    return {
        explanationJobMatch:
            matching.find(j => j.type === JOB_TYPES.XAI_EXPLANATIONS) ?? null,
        surrogateJobMatch:
            matching.find(j => j.type === JOB_TYPES.XAI_SURROGATE) ?? null,
        // True while the initial fetch is in flight, false once we know whether
        // anything is running.
        isCheckingForActiveJobs: enabled && isFetching && data === undefined,
    };
};
