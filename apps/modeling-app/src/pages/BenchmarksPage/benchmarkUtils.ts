import type { BacktestRead, BacktestSpecificationRead, MakeBacktestsRequest, MetricInfo } from '@dhis2-chap/ui';

export const getMetricIds = (backtests: BacktestRead[]) =>
    [...new Set(backtests.flatMap(run => Object.keys(run.aggregateMetrics)))].sort();

/** Lower rank is better. Unknown metrics are deliberately not ranked. */
const metricRank = (value: number, metric?: MetricInfo): number | undefined => {
    if (!Number.isFinite(value) || !metric) return undefined;
    if (metric.target != null) {
        return metric.targetBehavior === 'at_least'
            ? Math.max(0, metric.target - value)
            : Math.abs(value - metric.target);
    }
    if (metric.optimizationDirection === 'minimize') return value;
    if (metric.optimizationDirection === 'maximize') return -value;
    return undefined;
};

export const getBestRunIds = (backtests: BacktestRead[], metric?: MetricInfo): Set<number> => {
    if (!metric) return new Set();
    const ranks = backtests.flatMap((run) => {
        const rank = metricRank(run.aggregateMetrics[metric.id], metric);
        return rank === undefined ? [] : [{ id: run.id, rank }];
    });
    const best = ranks.reduce((minimum, { rank }) => Math.min(minimum, rank), Infinity);
    return new Set(ranks.filter(({ rank }) => Math.abs(rank - best) <= 1e-12).map(({ id }) => id));
};

export const makeBenchmarkRequest = (
    specification: BacktestSpecificationRead,
    modelIds: number[],
    name: string,
): MakeBacktestsRequest => ({
    name,
    modelIds,
    datasetId: specification.dataset.id,
    nPeriods: specification.nPeriods,
    nSplits: specification.nSplits,
    stride: specification.stride,
    nRetrain: specification.nRetrain,
    futureWeatherProvider: specification.futureWeatherProvider,
});

const csvCell = (value: string | number | null | undefined): string => {
    // Quote CSV delimiters and keep model/dataset names from becoming spreadsheet formulas.
    const text = typeof value === 'string' && /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
};

export const benchmarkCsv = (specification: BacktestSpecificationRead, backtests: BacktestRead[]): string => {
    const metrics = getMetricIds(backtests);
    const rows = [
        ['specification_id', 'dataset_id', 'dataset', 'first_period', 'last_period', 'n_periods', 'n_splits', 'stride', 'n_retrain', 'future_weather_provider', 'evaluation_id', 'model', 'version', 'created', ...metrics],
        ...backtests.map(run => [
            specification.id, specification.dataset.id, specification.dataset.name,
            specification.dataset.firstPeriod, specification.dataset.lastPeriod,
            specification.nPeriods, specification.nSplits, specification.stride, specification.nRetrain,
            specification.futureWeatherProvider, run.id, run.configuredModel?.name ?? run.modelId,
            run.modelTemplateVersion, run.created,
            ...metrics.map(id => Number.isFinite(run.aggregateMetrics[id]) ? run.aggregateMetrics[id] : ''),
        ]),
    ];
    return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
};
