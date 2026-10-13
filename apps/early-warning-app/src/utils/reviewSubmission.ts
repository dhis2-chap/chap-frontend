import type { AlertRead } from '@dhis2-chap/ui';

export type Decision = 'accept' | 'decline';
export type ReviewStep = 'validateImport' | 'recordDecisions' | 'importForecast' | 'saveImport';
export type StepStatus = 'pending' | 'running' | 'done' | 'failed';
export type ReviewTask = { id: string; step: ReviewStep; run: () => Promise<unknown> };

export const getDecisionChanges = (alerts: AlertRead[], decisions: Map<number, Decision>) => {
    const accepted = alerts.filter(alert => decisions.get(alert.id) === 'accept' && alert.approved !== 'approved');
    const declined = alerts.filter(alert => decisions.get(alert.id) === 'decline' && alert.approved !== 'declined');
    return { accepted, declined, withdrawn: declined.filter(alert => alert.approved === 'approved') };
};

/** Retain completed task IDs for this submission so retry resumes at the failure. */
export const runReviewTasks = async (
    tasks: ReviewTask[],
    completed: Set<string>,
    onProgress: (step: ReviewStep, status: StepStatus) => void,
) => {
    for (const task of tasks) {
        if (completed.has(task.id)) continue;
        onProgress(task.step, 'running');
        try {
            await task.run();
            completed.add(task.id);
            if (tasks.filter(other => other.step === task.step).every(other => completed.has(other.id))) {
                onProgress(task.step, 'done');
            }
        } catch (error) {
            onProgress(task.step, 'failed');
            throw error;
        }
    }
};
