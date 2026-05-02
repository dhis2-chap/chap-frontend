import { describe, it, expect } from 'vitest';
import { formatFeatureName } from './utils';

describe('formatFeatureName', () => {
    it('replaces underscores with spaces', () => {
        expect(formatFeatureName('rainfall_mm')).toBe('Rainfall Mm');
    });

    it('capitalizes the first letter of each word', () => {
        expect(formatFeatureName('mean temperature celsius')).toBe('Mean Temperature Celsius');
    });

    it('handles a single word', () => {
        expect(formatFeatureName('population')).toBe('Population');
    });

    it('handles already-capitalized words', () => {
        expect(formatFeatureName('GDP_per_capita')).toBe('GDP Per Capita');
    });

    it('returns empty string for empty input', () => {
        expect(formatFeatureName('')).toBe('');
    });

    it('handles repeated underscores', () => {
        expect(formatFeatureName('a__b')).toBe('A  B');
    });
});
