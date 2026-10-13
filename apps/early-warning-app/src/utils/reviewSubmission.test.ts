import { describe, expect, it, vi } from 'vitest';
import type { AlertRead } from '@dhis2-chap/ui';
import { getDecisionChanges, runReviewTasks, type ReviewTask } from './reviewSubmission';

describe('review submission', () => {
    it('leaves undecided alerts unchanged and identifies withdrawals', () => {
        const alerts = [{ id: 1, approved: 'pending' }, { id: 2, approved: 'approved' }, { id: 3, approved: 'declined' }] as AlertRead[];
        expect(getDecisionChanges(alerts, new Map([[2, 'decline'], [3, 'decline']]))).toEqual({ accepted: [], declined: [alerts[1]], withdrawn: [alerts[1]] });
    });

    it('does not record decisions if import validation fails', async () => {
        const record = vi.fn();
        const progress = vi.fn();
        const tasks: ReviewTask[] = [
            { id: 'validate', step: 'validateImport', run: async () => { throw Error('Invalid mapping'); } },
            { id: 'record', step: 'recordDecisions', run: record },
        ];
        await expect(runReviewTasks(tasks, new Set(), progress)).rejects.toThrow('Invalid mapping');
        expect(record).not.toHaveBeenCalled();
        expect(progress.mock.calls).toEqual([['validateImport', 'running'], ['validateImport', 'failed']]);
    });

    it('announces a mutation attempt even when its outcome fails', async () => {
        const progress = vi.fn();
        const completed = new Set<string>();
        await expect(runReviewTasks([{ id: 'accept', step: 'recordDecisions', run: async () => {
            throw Error('Connection lost');
        } }], completed, progress)).rejects.toThrow('Connection lost');
        expect(progress.mock.calls).toEqual([['recordDecisions', 'running'], ['recordDecisions', 'failed']]);
        expect(completed.size).toBe(0);
    });

    it('retries the failed import without recording completed decisions again', async () => {
        const order: string[] = [];
        let fail = true;
        const tasks: ReviewTask[] = [
            { id: 'validate', step: 'validateImport', run: async () => { order.push('validate'); } },
            { id: 'accept', step: 'recordDecisions', run: async () => { order.push('accept'); } },
            { id: 'decline', step: 'recordDecisions', run: async () => { order.push('decline'); } },
            { id: 'import', step: 'importForecast', run: async () => {
                if (fail) throw Error('Import failed');
                order.push('import');
            } },
        ];
        const completed = new Set<string>();
        await expect(runReviewTasks(tasks, completed, vi.fn())).rejects.toThrow('Import failed');
        fail = false;
        await runReviewTasks(tasks, completed, vi.fn());
        expect(order).toEqual(['validate', 'accept', 'decline', 'import']);
    });
});
