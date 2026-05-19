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
    const [hasJobSucceeded, setHasJobSucceeded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset transient job state when the user switches XAI method.
    const prevXaiMethod = useRef(xaiMethod);
    useEffect(() => {
        if (prevXaiMethod.current === xaiMethod) return;
        prevXaiMethod.current = xaiMethod;
        setExplanationJobId(xaiJobStorage.get(predictionId, xaiMethod));
        setSurrogateJobId(null);
        setHasJobSucceeded(false);
    }, [xaiMethod, predictionId]);

    // Discover any in-flight jobs (only when nothing's already running or done).
    const { explanationJobMatch, surrogateJobMatch, isCheckingForActiveJobs } =
        useActiveXaiJobs({
            predictionId,
            xaiMethod,
            enabled: !explanationJobId && !surrogateJobId && !hasJobSucceeded,
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
        if (status !== 'SUCCESS' && status !== 'FAILURE' && status !== 'REVOKED') return;

        xaiJobStorage.clear(predictionId, xaiMethod);
        setExplanationJobId(null);

        if (status === 'SUCCESS') {
            setHasJobSucceeded(true);
            queryClient.invalidateQueries({ queryKey: ['globalExplanation', predictionId, xaiMethod] });
            queryClient.invalidateQueries({ queryKey: ['localExplanations', predictionId] });
            queryClient.invalidateQueries({ queryKey: ['shapBeeswarm', predictionId] });
            queryClient.invalidateQueries({ queryKey: ['horizonSummary', predictionId] });
        } else {
            setError(
                status === 'FAILURE'
                    ? i18n.t('Explanation job failed. Check Jobs for details.')
                    : i18n.t('Explanation job was revoked. Check Jobs for details.'),
            );
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
        if (status !== 'SUCCESS' && status !== 'FAILURE' && status !== 'REVOKED') return;

        setSurrogateJobId(null);
        if (status !== 'SUCCESS') {
            setError(
                status === 'FAILURE'
                    ? i18n.t('Surrogate model training failed. Check Jobs for details.')
                    : i18n.t('Surrogate model training was revoked. Check Jobs for details.'),
            );
        }
    }, [surrogateJobId, surrogateJob.status]);

    const run = useCallback(async () => {
        if (!predictionId || isRunning) return;
        setError(null);
        // Re-running for a method that previously succeeded: clear the cached
        // success flag so the UI reflects the fresh run instead of relying on
        // the prior run's state.
        setHasJobSucceeded(false);
        try {
            const job = await XaiService.runExplanationsV1XaiPredictionsPredictionIdExplanationsRunPost(
                predictionId,
                { xaiMethod },
            );
            xaiJobStorage.set(predictionId, xaiMethod, job.id);
            setExplanationJobId(job.id);
        } catch (e) {
            setError(
                (e instanceof Error ? e.message : String(e))
                || i18n.t('Failed to start explanation run'),
            );
        }
    }, [predictionId, xaiMethod, isRunning]);

    return {
        isRunning,
        hasJobSucceeded,
        isCheckingForActiveJobs,
        error,
        run,
        isExplanationRunning: explanationJob.isRunning,
        isSurrogateRunning: surrogateJob.isRunning,
    };
};
