import { describe, expect, it } from 'vitest';
import type { BacktestRead, BacktestSpecificationRead, ConfiguredModelRead, MetricInfo, ModelSpecRead } from '@dhis2-chap/ui';
import { benchmarkCsv, getBestRunIds, getJobModelName, getMetricIds, getModelsWithRun, makeBenchmarkRequest, metricSortKey, requestMatchesSpecification } from './benchmarkUtils';

const run = (id: number, aggregateMetrics: Record<string, number>): BacktestRead => ({
    id, aggregateMetrics, datasetId: 12, modelId: `model-${id}`, configuredModel: null,
    dataset: { id: 12, name: 'Dataset' }, specificationId: 8,
});
const specification: BacktestSpecificationRead = {
    id: 8, dataset: { id: 12, name: 'Dataset, "monthly"', firstPeriod: '202001', lastPeriod: '202412' },
    orgUnits: ['a'], backtests: [], nPeriods: 4, nSplits: 7, stride: 2, nRetrain: 3,
    futureWeatherProvider: 'perfect',
};

describe('benchmark scores', () => {
    it('ranks lower and higher scores, includes ties, and ignores missing/non-finite values', () => {
        const runs = [run(1, { score: 0 }), run(2, { score: 2 }), run(3, { score: 0 }), run(4, {}), run(5, { score: NaN }), run(6, { score: Infinity })];
        expect(getBestRunIds(runs, { id: 'score', displayName: 'Score', optimizationDirection: 'minimize' } as MetricInfo)).toEqual(new Set([1, 3]));
        expect(getBestRunIds(runs, { id: 'score', displayName: 'Score', optimizationDirection: 'maximize' } as MetricInfo)).toEqual(new Set([2]));
    });

    it('judges target metrics by distance or by meeting the minimum target', () => {
        const runs = [run(1, { score: 0.7 }), run(2, { score: 0.9 }), run(3, { score: 0.95 })];
        expect(getBestRunIds(runs, { id: 'score', displayName: 'Score', target: 0.8, targetBehavior: 'closest' } as MetricInfo)).toEqual(new Set([1, 2]));
        expect(getBestRunIds(runs, { id: 'score', displayName: 'Score', target: 0.8, targetBehavior: 'at_least' } as MetricInfo)).toEqual(new Set([2, 3]));
        expect(getBestRunIds([run(1, { score: -3 }), run(2, { score: 1 })], { id: 'score', displayName: 'Score', target: 0 })).toEqual(new Set([2]));
    });

    it('does not invent a direction for unknown metrics or mark absent scores as best', () => {
        expect(getBestRunIds([run(1, { score: 2 })])).toEqual(new Set());
        expect(getBestRunIds([run(1, { score: 2 })], { id: 'score', displayName: 'Score' })).toEqual(new Set());
        expect(getBestRunIds([run(1, {})], { id: 'score', displayName: 'Score', target: 0 })).toEqual(new Set());
    });

    it('sorts the best scores first, including target metrics', () => {
        const sortBy = (metric?: MetricInfo) => (scores: number[]) => [...scores].sort((a, b) => metricSortKey(a, metric) - metricSortKey(b, metric));
        expect(sortBy({ id: 'score', displayName: 'Score', target: 0.8, targetBehavior: 'closest' } as MetricInfo)([0.2, 0.79, 1])).toEqual([0.79, 1, 0.2]);
        expect(sortBy({ id: 'score', displayName: 'Score', optimizationDirection: 'maximize' } as MetricInfo)([1, 3, 2])).toEqual([3, 2, 1]);
        expect(sortBy()([3, 1, 2])).toEqual([1, 2, 3]);
    });
});

it('preserves all saved parameters, rather than using evaluation defaults', () => {
    expect(makeBenchmarkRequest(specification, [10, 11], 'Benchmark 8')).toEqual({
        name: 'Benchmark 8', modelIds: [10, 11], datasetId: 12,
        nPeriods: 4, nSplits: 7, stride: 2, nRetrain: 3, futureWeatherProvider: 'perfect',
    });
});

it('exports all metrics in the supplied row order, with raw precision, blanks and CSV escaping', () => {
    const runs = [
        { ...run(2, { mae: 1.23456789 }), modelId: '=SUM(1,2)', modelTemplateVersion: '1.0', created: '2026-09-29T10:00:00' },
        run(1, { mae: NaN, rmse: -2, sample_count: 5 }),
    ];
    expect(getMetricIds(runs)).toEqual(['mae', 'rmse']);
    const csv = benchmarkCsv(specification, runs);
    expect(csv).toContain('"Dataset, ""monthly"""');
    expect(csv).toContain('"\'=SUM(1,2)"');
    expect(csv.split('\r\n')[1]).toContain('"1.23456789",""');
    expect(csv.split('\r\n')[2]).toContain('"","-2"');
    expect(csv).not.toContain('NaN');
    expect(csv).toContain('"future_weather_provider"');
});

it('flags models that already ran at their current template version', () => {
    const model = (id: number, version: string) => ({ id, name: `model-${id}`, version }) as ModelSpecRead;
    const ranWith = (modelId: number, version: string) => ({
        ...run(modelId, {}), configuredModel: { id: modelId } as ConfiguredModelRead, modelTemplateVersion: version,
    });
    const runs = [ranWith(1, '1.0'), ranWith(2, '1.0')];
    expect(getModelsWithRun(runs, [model(1, '1.0'), model(2, '2.0'), model(3, '1.0')]).map(m => m.id)).toEqual([1]);
});

it('matches running evaluation requests to the benchmark they file under', () => {
    const request = makeBenchmarkRequest(specification, [10], 'Benchmark 8');
    expect(requestMatchesSpecification(request, specification)).toBe(true);
    expect(requestMatchesSpecification({ ...request, datasetId: 13 }, specification)).toBe(false);
    expect(requestMatchesSpecification({ ...request, stride: 1 }, specification)).toBe(false);
    // Omitted parameters take CHAP Core's defaults, as in the saved-dataset evaluation form.
    const defaults = { ...specification, nPeriods: 3, nSplits: 7, stride: 1, nRetrain: 1, futureWeatherProvider: 'climatology' };
    expect(requestMatchesSpecification({ name: 'My evaluation', modelIds: [10], datasetId: 12 }, defaults)).toBe(true);
    expect(requestMatchesSpecification({ name: 'My evaluation', modelIds: [10], datasetId: 12 }, specification)).toBe(false);
});

it('reads the model name from a multi-model job name', () => {
    expect(getJobModelName('Benchmark 8/naive_model')).toBe('naive_model');
    expect(getJobModelName('Rainfall / cases/ewars')).toBe('ewars');
});
