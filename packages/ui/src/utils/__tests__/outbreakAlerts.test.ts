import { describe, expect, it } from 'vitest';
import type { PredictionOrgUnitSeries, PredictionPointVM } from '../../interfaces/Prediction';
import {
    buildOutbreakIndicatorsForSeries,
    calculateMockEndemicThreshold,
    getSupportedOutbreakProbabilityBucket,
    isOutbreakAtProbability,
    parseOutbreakProbability,
} from '../outbreakAlerts';

const point = (
    quantiles: PredictionPointVM['quantiles'],
    period = '202401',
): PredictionPointVM => ({
    period,
    periodLabel: period,
    quantiles,
});

const basePoint = point({
    quantile_low: 10,
    quantile_mid_low: 20,
    median: 30,
    quantile_mid_high: 40,
    quantile_high: 50,
});

describe('outbreak alert utilities', () => {
    it('parses supported alert probabilities and defaults unsupported values', () => {
        expect(parseOutbreakProbability('10')).toBe(10);
        expect(parseOutbreakProbability('75')).toBe(75);
        expect(parseOutbreakProbability('80')).toBe(75);
        expect(parseOutbreakProbability(null)).toBe(75);
    });

    it('returns the highest supported outbreak probability bucket', () => {
        expect(getSupportedOutbreakProbabilityBucket(basePoint, 9)).toBe(90);
        expect(getSupportedOutbreakProbabilityBucket(basePoint, 10)).toBe(90);
        expect(getSupportedOutbreakProbabilityBucket(basePoint, 20)).toBe(75);
        expect(getSupportedOutbreakProbabilityBucket(basePoint, 30)).toBe(50);
        expect(getSupportedOutbreakProbabilityBucket(basePoint, 40)).toBe(25);
        expect(getSupportedOutbreakProbabilityBucket(basePoint, 50)).toBe(10);
        expect(getSupportedOutbreakProbabilityBucket(basePoint, 51)).toBe('<10');
    });

    it('uses quantile locksteps for selected probability alerts', () => {
        expect(isOutbreakAtProbability(basePoint, 20, 75)).toBe(true);
        expect(isOutbreakAtProbability(basePoint, 21, 75)).toBe(false);
        expect(isOutbreakAtProbability(basePoint, 10, 90)).toBe(true);
        expect(isOutbreakAtProbability(basePoint, 11, 90)).toBe(false);
        expect(isOutbreakAtProbability(basePoint, 50, 10)).toBe(true);
        expect(isOutbreakAtProbability(basePoint, 51, 10)).toBe(false);
    });

    it('calculates mock endemic threshold as mean plus two population standard deviations', () => {
        const result = calculateMockEndemicThreshold([
            { period: '202301', value: 10 },
            { period: '202302', value: 12 },
            { period: '202303', value: 14 },
            { period: '202304', value: 16 },
        ]);

        expect(result.available).toBe(true);
        expect(result.observationCount).toBe(4);
        expect(result.threshold).toBeCloseTo(17.4721, 4);
    });

    it('marks threshold unavailable with fewer than four non-null observations', () => {
        const result = calculateMockEndemicThreshold([
            { period: '202301', value: 10 },
            { period: '202302', value: null },
            { period: '202303', value: 14 },
            { period: '202304', value: 16 },
        ]);

        expect(result).toEqual({
            available: false,
            threshold: null,
            observationCount: 3,
        });
    });

    it('builds forecast-period outbreak indicators and skips unavailable thresholds', () => {
        const series: PredictionOrgUnitSeries = {
            targetId: 'target',
            orgUnitId: 'ou-a',
            orgUnitName: 'Region A',
            actualCases: [
                { period: '202301', value: 10 },
                { period: '202302', value: 12 },
                { period: '202303', value: 14 },
                { period: '202304', value: 16 },
            ],
            points: [
                basePoint,
                point({
                    quantile_low: 1,
                    quantile_mid_low: 2,
                    median: 3,
                    quantile_mid_high: 4,
                    quantile_high: 5,
                }, '202402'),
            ],
        };

        const indicators = buildOutbreakIndicatorsForSeries(series, 75);

        expect(indicators).toHaveLength(2);
        expect(indicators[0]).toMatchObject({
            orgUnitId: 'ou-a',
            orgUnitName: 'Region A',
            period: '202401',
            supportedProbability: 75,
            outbreak: true,
            value: '1',
        });
        expect(indicators[1]).toMatchObject({
            period: '202402',
            supportedProbability: '<10',
            outbreak: false,
            value: '0',
        });

        expect(buildOutbreakIndicatorsForSeries({
            ...series,
            actualCases: [{ period: '202301', value: 10 }],
        }, 75)).toEqual([]);
    });
});
