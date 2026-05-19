import { describe, it, expect } from 'vitest';
import {
    explainabilityAlignedTabChartHeight,
    explainabilityBeeswarmChartHeight,
    explainabilityImportanceChartHeight,
    formatFeatureName,
} from './utils';

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

describe('explainability chart heights', () => {
    it('explainabilityImportanceChartHeight uses floor and per-feature row height', () => {
        expect(explainabilityImportanceChartHeight(0)).toBe(200);
        expect(explainabilityImportanceChartHeight(10)).toBe(430);
    });

    it('explainabilityBeeswarmChartHeight uses a higher floor', () => {
        expect(explainabilityBeeswarmChartHeight(0)).toBe(300);
        expect(explainabilityBeeswarmChartHeight(5)).toBe(370);
    });

    it('explainabilityAlignedTabChartHeight matches the larger of the two when beeswarm is supported', () => {
        expect(explainabilityAlignedTabChartHeight(10, 5, true)).toBe(430);
        expect(explainabilityAlignedTabChartHeight(2, 10, true)).toBe(620);
    });

    it('explainabilityAlignedTabChartHeight ignores beeswarm when not supported', () => {
        expect(explainabilityAlignedTabChartHeight(10, 99, false)).toBe(430);
    });
});
