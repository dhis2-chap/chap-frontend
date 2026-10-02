import { beforeEach, describe, expect, it, vi } from 'vitest';
const { listAlerts } = vi.hoisted(() => ({ listAlerts: vi.fn() }));
vi.mock('@dhis2-chap/ui', () => ({ AlertsService: { listAlertsV1CrudAlertsGet: listAlerts } }));
import { loadPredictionAlerts } from './predictionAlerts';

describe('stored prediction alerts', () => {
    beforeEach(() => listAlerts.mockReset());
    it('never requests the global alert list for a setup with no runs', async () => {
        expect(await loadPredictionAlerts([])).toEqual([]);
        expect(listAlerts).not.toHaveBeenCalled();
    });
    it('includes historical policies but excludes alerts belonging to other setups sharing a policy', async () => {
        const rows = [
            { id: 1, predictionId: 10, alertPolicyId: 1, timePeriod: '2025-01', orgUnit: 'A' },
            { id: 2, predictionId: 11, alertPolicyId: 2, timePeriod: '2025-02', orgUnit: 'A' },
            { id: 3, predictionId: 99, alertPolicyId: 2, timePeriod: '2025-03', orgUnit: 'A' },
        ];
        listAlerts.mockResolvedValue(rows);
        expect(await loadPredictionAlerts([10, 11, 10])).toEqual([rows[1], rows[0]]);
        expect(listAlerts.mock.calls).toEqual([[undefined, 10], [undefined, 11]]);
    });
    it('fails the listing if one run fails rather than presenting partial results as complete', async () => {
        listAlerts.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Unavailable'));
        await expect(loadPredictionAlerts([10, 11])).rejects.toThrow('Unavailable');
    });
});
