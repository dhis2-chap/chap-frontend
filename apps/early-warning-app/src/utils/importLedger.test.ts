import { describe, expect, it, vi } from 'vitest';
import type { AlertRead } from '@dhis2-chap/ui';
import { runReviewTasks, type ReviewTask } from './reviewSubmission';
import { describeImportedIndicators, getWithdrawnIndicators, updateImportLedger } from './importLedger';

const original = { alertId: 1, dataElement: 'originalTarget', orgUnit: 'A', period: '202401' };
const changed = { alertId: 1, dataElement: 'changedTarget', orgUnit: 'A', period: '202401' };

describe('imported outbreak indicators', () => {
    it('clears every previously imported target when a reviewed alert is withdrawn', () => {
        const records = updateImportLedger([original], [changed], []);
        const withdrawn = getWithdrawnIndicators(records, [{ id: 1 }] as AlertRead[]);
        expect(withdrawn).toEqual([original, changed]);
        expect(updateImportLedger(records, [], withdrawn)).toEqual([]);
    });

    it('does not clear unrelated or never imported indicators', () => {
        expect(getWithdrawnIndicators([original], [{ id: 2 }] as AlertRead[])).toEqual([]);
        expect(updateImportLedger([original], [original], [])).toEqual([original]);
    });

    it('records only accepted indicator values, preserving the actual DHIS2 period and mapping', () => {
        const accepted = [{ id: 1, orgUnit: 'A', timePeriod: '2024-01' }] as AlertRead[];
        expect(describeImportedIndicators([
            { dataElement: 'originalTarget', orgUnit: 'A', period: '202401', value: '1' },
            { dataElement: 'forecast', orgUnit: 'A', period: '202401', value: '20' },
        ], 'originalTarget', accepted)).toEqual([original]);
    });
    it('retries a failed ledger save without importing the indicators again', async () => {
        const importValues = vi.fn(async () => undefined);
        const saveRecord = vi.fn().mockRejectedValueOnce(Error('Save failed')).mockResolvedValueOnce(undefined);
        const tasks: ReviewTask[] = [
            { id: 'import', step: 'importForecast', run: importValues },
            { id: 'saveImport', step: 'saveImport', run: saveRecord },
        ];
        const completed = new Set<string>();
        await expect(runReviewTasks(tasks, completed, vi.fn())).rejects.toThrow('Save failed');
        await runReviewTasks(tasks, completed, vi.fn());
        expect(importValues).toHaveBeenCalledTimes(1);
        expect(saveRecord).toHaveBeenCalledTimes(2);
    });
});
