import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { XaiService } from '@dhis2-chap/ui';
import { useActiveXaiJobs } from './useActiveXaiJobs';
import { useXaiJobStatus } from './useXaiJobStatus';
import { xaiJobStorage } from './xaiJobStorage';

type Args = {
    predictionId: number;
    xaiMethod: string;
};

/**
 * Owns the full XAI explanation job lifecycle for one prediction × xaiMethod:
 * discovery of in-flight jobs, polling of explanation + surrogate-training jobs,
 * persistence of the running job ID across reloads, and per-method "done" state.
 */
export const useXaiExplanationJob = ({
    predictionId,
    xaiMethod,
}: Args) => {
    const queryClient = useQueryClient();

    const [explanationJobId, setExplanationJobId] = useState<string | null>(
        () => xaiJobStorage.get(predictionId, xaiMethod),
    );
    const [surrogateJobId, setSurrogateJobId] = useState<string | null>(null);
    const [completedMethods, setCompletedMethods] = useState<
        Record<string, boolean>
    >({});
    const [error, setError] = useState<string | null>(null);

    const isComplete = !!completedMethods[xaiMethod];

    // Reset transient job state when the user switches XAI method.
    const prevXaiMethod = useRef(xaiMethod);
    useEffect(() => {
        if (prevXaiMethod.current === xaiMethod) return;
        prevXaiMethod.current = xaiMethod;
        setExplanationJobId(xaiJobStorage.get(predictionId, xaiMethod));
        setSurrogateJobId(null);
    }, [xaiMethod, predictionId]);

    // Discover any in-flight jobs (only when nothing's already running or done).
    const { explanationJobMatch, surrogateJobMatch, isCheckingForActiveJobs } =
        useActiveXaiJobs({
            predictionId,
            xaiMethod,
            enabled: !explanationJobId && !surrogateJobId && !isComplete,
        });
    useEffect(() => {
        if (explanationJobMatch && !explanationJobId) {
            setExplanationJobId(explanationJobMatch.id);
        }
    }, [explanationJobMatch, explanationJobId]);
    useEffect(() => {
        if (surrogateJobMatch && !surrogateJobId && !explanationJobId) {
            setSurrogateJobId(surrogateJobMatch.id);
        }
    }, [surrogateJobMatch, surrogateJobId, explanationJobId]);

    const explanationJob = useXaiJobStatus(explanationJobId);
    const surrogateJob = useXaiJobStatus(surrogateJobId);
    const isRunning = explanationJob.isRunning || surrogateJob.isRunning;

    // Explanation job terminal handling
    useEffect(() => {
        if (!explanationJobId) return;
        const status = explanationJob.status;
        if (status === 'SUCCESS') {
            xaiJobStorage.clear(predictionId, xaiMethod);
            setCompletedMethods(prev => ({ ...prev, [xaiMethod]: true }));
            queryClient.invalidateQueries({
                queryKey: ['globalExplanation', predictionId, xaiMethod],
            });
            queryClient.invalidateQueries({
                queryKey: ['localExplanations', predictionId],
            });
            queryClient.invalidateQueries({
                queryKey: ['shapBeeswarm', predictionId],
            });
            queryClient.invalidateQueries({
                queryKey: ['horizonSummary', predictionId],
            });
            setExplanationJobId(null);
        } else if (status === 'FAILURE') {
            xaiJobStorage.clear(predictionId, xaiMethod);
            setError(i18n.t('Explanation job failed. Check Jobs for details.'));
            setExplanationJobId(null);
        } else if (status === 'REVOKED') {
            xaiJobStorage.clear(predictionId, xaiMethod);
            setError(
                i18n.t('Explanation job was revoked. Check Jobs for details.'),
            );
            setExplanationJobId(null);
        }
    }, [
        explanationJobId,
        explanationJob.status,
        predictionId,
        xaiMethod,
        queryClient,
    ]);

    // Surrogate job terminal handling
    useEffect(() => {
        if (!surrogateJobId) return;
        const status = surrogateJob.status;
        if (status === 'SUCCESS') {
            setSurrogateJobId(null);
        } else if (status === 'FAILURE') {
            setError(
                i18n.t(
                    'Surrogate model training failed. Check Jobs for details.',
                ),
            );
            setSurrogateJobId(null);
        } else if (status === 'REVOKED') {
            setError(
                i18n.t(
                    'Surrogate model training was revoked. Check Jobs for details.',
                ),
            );
            setSurrogateJobId(null);
        }
    }, [surrogateJobId, surrogateJob.status]);

    const markComplete = useCallback(() => {
        setCompletedMethods(prev =>
            prev[xaiMethod] ? prev : { ...prev, [xaiMethod]: true },
        );
    }, [xaiMethod]);

    const run = useCallback(async () => {
        if (!predictionId || isRunning) return;
        setError(null);
        try {
            const job = await XaiService.runExplanations(
                predictionId,
                xaiMethod,
            );
            xaiJobStorage.set(predictionId, xaiMethod, job.id);
            setExplanationJobId(job.id);
        } catch (e) {
            setError(
                (e instanceof Error ? e.message : String(e))
                || 'Failed to start explanation run',
            );
        }
    }, [predictionId, xaiMethod, isRunning]);

    return {
        isRunning,
        isComplete,
        isCheckingForActiveJobs,
        error,
        run,
        markComplete,
        isExplanationRunning: explanationJob.isRunning,
        isSurrogateRunning: surrogateJob.isRunning,
    };
};
