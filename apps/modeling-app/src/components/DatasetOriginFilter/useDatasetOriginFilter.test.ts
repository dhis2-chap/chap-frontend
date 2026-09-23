import { describe, expect, it } from 'vitest';
import { matchesOrigin } from './useDatasetOriginFilter';

const dataset = (createdManually?: boolean) => ({ name: 'test', createdManually });

describe('matchesOrigin', () => {
    it('filters on the createdManually flag', () => {
        expect(matchesOrigin(dataset(true), 'manual')).toBe(true);
        expect(matchesOrigin(dataset(false), 'manual')).toBe(false);
        expect(matchesOrigin(dataset(false), 'generated')).toBe(true);
    });

    it('treats datasets from backends without the flag as manual', () => {
        expect(matchesOrigin(dataset(), 'manual')).toBe(true);
        expect(matchesOrigin(dataset(), 'generated')).toBe(false);
    });

    it('matches everything without an origin', () => {
        expect(matchesOrigin(dataset(false), undefined)).toBe(true);
    });
});
