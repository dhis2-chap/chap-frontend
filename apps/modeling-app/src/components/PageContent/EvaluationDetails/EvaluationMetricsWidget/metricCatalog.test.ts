import { describe, expect, it } from 'vitest';
import type { MetricInfo } from '@dhis2-chap/ui';
import { formatComparison, formatScore, getComparisonGuidance, getDefaultMetricIds, getMetricGuidance, sortMetricIds } from './metricCatalog';

const catalog = [
    { id: 'rmse', displayName: 'RMSE', sortOrder: 1, isSelected: false },
    { id: 'mape', displayName: 'MAPE', sortOrder: 0, isSelected: true },
] as MetricInfo[];

describe('metric defaults', () => {
    it('orders metrics by the configured order, then headline order, then name', () => {
        expect(sortMetricIds(['zeta', 'crps_log1p', 'rmse', 'alpha', 'mape'], catalog)).toEqual(['mape', 'rmse', 'crps_log1p', 'alpha', 'zeta']);
        expect(sortMetricIds(['rmse', 'mae', 'crps_log1p'])).toEqual(['crps_log1p', 'mae', 'rmse']);
    });

    it('shows the selected metrics by default and falls back to the headline metrics', () => {
        expect(getDefaultMetricIds(['rmse', 'mape', 'mae'], catalog)).toEqual(['mape']);
        expect(getDefaultMetricIds(['rmse', 'zeta', 'mae'])).toEqual(['rmse', 'mae']);
    });
});

describe('metric guidance', () => {
    it('explains how to read a score from the backend direction or target', () => {
        const guidance = (metric: object) => getMetricGuidance(metric as MetricInfo);
        expect(guidance({ optimizationDirection: 'minimize' })).toBe('Lower is better.');
        expect(guidance({ optimizationDirection: 'maximize' })).toBe('Higher is better.');
        expect(guidance({ target: 0.8, targetBehavior: 'closest' })).toBe('Closer to the target of 0.8 is better.');
        expect(guidance({ target: 80, unit: '%', targetBehavior: 'at_least' })).toBe('Higher is better, up to the target of 80 %.');
        expect(guidance({ optimizationDirection: null })).toBeUndefined();
    });
});

describe('comparison guidance', () => {
    const guidance = (metric: object) => getComparisonGuidance(metric as MetricInfo, 'Global median');

    it('explains each comparison operator with the reference by name and the sign convention', () => {
        expect(guidance({ comparisonOp: 'skill_ratio' })).toBe('Relative improvement over Global median. +20% means 20% better than it, -20% means 20% worse.');
        expect(guidance({ comparisonOp: 'difference', unit: '%' })).toBe('Improvement over Global median in the units of the score. Positive means better, negative means worse.');
        expect(guidance({ comparisonOp: 'target_distance', target: 0.8 })).toBe('How much closer to the target of 0.8 than Global median. Positive means better, negative means worse.');
    });

    it('falls back to the backend description, then to the sign convention', () => {
        expect(guidance({ comparisonOp: 'new_op', comparisonDescription: 'Backend explanation.' })).toBe('Backend explanation.');
        expect(guidance({ comparisonOp: 'new_op' })).toBe('Compared with Global median. Positive means better, negative means worse.');
        expect(guidance({})).toBe('Compared with Global median. Positive means better, negative means worse.');
    });

    it('formats a skill ratio as a signed percentage and other comparisons in the metric units', () => {
        expect(formatComparison(0.76, { comparisonOp: 'skill_ratio' } as MetricInfo)).toBe('+76%');
        expect(formatComparison(-0.5, { comparisonOp: 'skill_ratio' } as MetricInfo)).toBe('-50%');
        expect(formatComparison(0.76, { comparisonOp: 'difference', unit: 'cases' } as MetricInfo)).toBe('+0.76 cases');
        expect(formatComparison(0, { comparisonOp: 'difference' } as MetricInfo)).toBe('0');
        expect(formatComparison(-4.06e-17, { comparisonOp: 'difference' } as MetricInfo)).toBe('0');
        expect(formatScore(-4.06e-17)).toBe('0');
        expect(formatScore(0.0000123456)).toBe('0.000012');
    });
});
