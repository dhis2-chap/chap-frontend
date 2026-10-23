import { describe, expect, it } from 'vitest';
import { normalizeImportSummary } from './importSummaryUtils';

const rejection = {
    reason: 'Missing value for some/all time periods',
    featureName: 'mean_temperature',
    orgUnit: 'W6sNfkJcXGC',
    timePeriods: ['2025W19', '2025W20', '2026W01'],
};

describe('normalizeImportSummary', () => {
    it('preserves all rejection details and the cache key for organisation-unit names', () => {
        const rejected = [rejection, { ...rejection, orgUnit: 'YvLOmtTQD6b', featureName: 'rainfall' }];
        expect(normalizeImportSummary({
            message: 'All regions rejected due to missing values',
            imported_count: 0,
            rejected,
        }, 'prediction-data')).toEqual({ id: null, importedCount: 0, rejected, hash: 'prediction-data' });
    });

    it('still accepts successful import summaries and rejections without periods', () => {
        const rejected = [{ reason: 'No data', featureName: 'rainfall', orgUnit: 'W6sNfkJcXGC' }];
        expect(normalizeImportSummary({ id: 42, importedCount: 1, rejected }))
            .toMatchObject({ id: 42, importedCount: 1, rejected });
    });

    it('rejects unknown or malformed details instead of passing unsafe rows to the dialog', () => {
        for (const detail of ['Bad Request', { rejected: [] },
            { imported_count: 0, rejected: [{ ...rejection, orgUnit: {} }] },
            { imported_count: 0, rejected: [{ ...rejection, timePeriods: [null] }] },
        ]) {
            expect(normalizeImportSummary(detail)).toBeNull();
        }
    });
});
