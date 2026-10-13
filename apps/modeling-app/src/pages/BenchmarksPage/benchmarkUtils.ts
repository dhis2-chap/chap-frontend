import type { BacktestRead, BacktestSpecificationRead, BacktestSpecificationSummary, MakeBacktestsRequest, MetricInfo, ModelSpecRead } from '@dhis2-chap/ui';
import { HIDDEN_METRIC_IDS } from '../../components/PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';

export const getMetricIds = (backtests: BacktestRead[]) =>
    [...new Set(backtests.flatMap(run => Object.keys(run.aggregateMetrics)))]
        .filter(id => !HIDDEN_METRIC_IDS.includes(id))
        .sort();

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

/** Ascending order puts the best score first; unranked metrics fall back to the raw score. */
export const metricSortKey = (value: number, metric?: MetricInfo) => metricRank(value, metric) ?? value;

export const getBestRunIds = (backtests: BacktestRead[], metric?: MetricInfo): Set<number> => {
    if (!metric) return new Set();
    const ranks = backtests.flatMap((run) => {
        const rank = metricRank(run.aggregateMetrics[metric.id], metric);
        return rank === undefined ? [] : [{ id: run.id, rank }];
    });
    const best = ranks.reduce((minimum, { rank }) => Math.min(minimum, rank), Infinity);
    return new Set(ranks.filter(({ rank }) => Math.abs(rank - best) <= 1e-12).map(({ id }) => id));
};

/** Models that already have a run in this benchmark at their current template version. */
export const getModelsWithRun = (backtests: BacktestRead[], models: ModelSpecRead[]) => models.filter(model => backtests.some(run =>
    run.configuredModel?.id === model.id && (run.modelTemplateVersion ?? null) === (model.version ?? null)));

export const makeBenchmarkRequest = (
    specification: BacktestSpecificationRead,
    modelIds: number[],
    name: string,
): MakeBacktestsRequest => ({
    name,
    modelIds,
    datasetId: specification.dataset.id,
    targetColumn: specification.targetColumn,
    nPeriods: specification.nPeriods,
    nSplits: specification.nSplits,
    stride: specification.stride,
    nRetrain: specification.nRetrain,
    futureWeatherProvider: specification.futureWeatherProvider,
});

// CHAP Core fills in these defaults when a request leaves the parameter out (BacktestParams).
const REQUEST_DEFAULTS = { nPeriods: 3, nSplits: 7, stride: 1, nRetrain: 1, futureWeatherProvider: 'climatology', targetColumn: 'disease_cases' };

export type SpecificationParams = Pick<BacktestSpecificationSummary, 'dataset' | 'nPeriods' | 'nSplits' | 'stride' | 'nRetrain' | 'futureWeatherProvider' | 'targetColumn'>;

/** Whether an evaluation request files its backtests under this benchmark. */
export const requestMatchesSpecification = (request: Partial<MakeBacktestsRequest>, specification: SpecificationParams) => {
    const params = { ...REQUEST_DEFAULTS, ...request };
    return request.datasetId === specification.dataset.id &&
        params.nPeriods === specification.nPeriods &&
        params.nSplits === specification.nSplits &&
        params.stride === specification.stride &&
        params.nRetrain === specification.nRetrain &&
        params.futureWeatherProvider === specification.futureWeatherProvider &&
        params.targetColumn === (specification.targetColumn ?? REQUEST_DEFAULTS.targetColumn);
};

/** CHAP Core names each job of a multi-model request `<request name>/<model name>`. */
export const getJobModelName = (jobName: string) => jobName.slice(jobName.lastIndexOf('/') + 1);

const csvCell = (value: string | number | null | undefined): string => {
    // Quote CSV delimiters and keep model/dataset names from becoming spreadsheet formulas.
    const text = typeof value === 'string' && /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
};

export const benchmarkCsv = (specification: BacktestSpecificationRead, backtests: BacktestRead[]): string => {
    const metrics = getMetricIds(backtests);
    const rows = [
        ['specification_id', 'dataset_id', 'dataset', 'first_period', 'last_period', 'n_periods', 'n_splits', 'stride', 'n_retrain', 'future_weather_provider', 'target_column', 'evaluation_id', 'model', 'version', 'created', ...metrics],
        ...backtests.map(run => [
            specification.id, specification.dataset.id, specification.dataset.name,
            specification.dataset.firstPeriod, specification.dataset.lastPeriod,
            specification.nPeriods, specification.nSplits, specification.stride, specification.nRetrain,
            specification.futureWeatherProvider, specification.targetColumn ?? REQUEST_DEFAULTS.targetColumn, run.id, run.configuredModel?.name ?? run.modelId,
            run.modelTemplateVersion, run.created,
            ...metrics.map(id => Number.isFinite(run.aggregateMetrics[id]) ? run.aggregateMetrics[id] : ''),
        ]),
    ];
    return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
};
