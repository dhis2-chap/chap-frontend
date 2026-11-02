import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader, colors, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    type MetricInfo,
    type PredictionSetupMonitoring,
    getPredictionSetupMonitoring,
    VisualizationsService,
    Widget,
} from '@dhis2-chap/ui';
import Highcharts from 'highcharts';
import accessibility from 'highcharts/modules/accessibility';
import HighchartsReact from 'highcharts-react-official';
import { getSelectedReference, referenceLabel, referenceName } from '@/components/ModelComparisons/referenceModels';
import { useBacktestById } from '@/hooks/useBacktestById';
import { useBacktestSpecification } from '@/pages/BenchmarksPage/useBacktestSpecification';
import { PREDICTION_SETUPS_QUERY_KEY } from '../../../../hooks/usePredictionSetups';
import { getChapErrorMessage } from '../../../../utils/chapErrors';
import { formatComparison, HIDDEN_METRIC_IDS } from '../../EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import { monitoringSeries } from './monitoringSeries';
import styles from './MonitoringWidget.module.css';

type Props = {
    predictionSetupId: number;
    evaluationId: number;
};

export const MonitoringWidget = ({ predictionSetupId, evaluationId }: Props) => {
    accessibility(Highcharts);
    const [open, setOpen] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState('');
    const [selectedBaseline, setSelectedBaseline] = useState<string>();
    const catalog = useQuery<MetricInfo[], ApiError>({
        queryKey: ['evaluation-metric-catalog', evaluationId],
        queryFn: () => VisualizationsService.getAvailableMetricsV1VisualizationMetricsBacktestIdGet(evaluationId),
        staleTime: 5 * 60 * 1000,
        retry: 0,
    });
    // Monitoring compares every run with a baseline, so metrics without a comparison cannot be monitored.
    const metrics = catalog.data?.filter(metric => !HIDDEN_METRIC_IDS.includes(metric.id) && metric.comparisonOp != null) ?? [];
    const metricId = selectedMetric || metrics.find(metric => metric.id === 'crps_log1p')?.id || metrics[0]?.id || '';
    const metric = metrics.find(item => item.id === metricId);

    const { backtest, error: backtestError } = useBacktestById(evaluationId);
    const specification = useBacktestSpecification(backtest?.specificationId ?? 0);
    const baselines = specification.data?.baselines ?? [];
    const baseline = getSelectedReference(baselines, selectedBaseline, specification.data?.defaultBaselineModel);
    // Without the specification's baselines, Chap Core falls back to its default baseline.
    const isBaselineResolved = !!baseline || specification.isSuccess || specification.isError || !!backtestError;

    const monitoring = useQuery<PredictionSetupMonitoring, ApiError>({
        queryKey: [PREDICTION_SETUPS_QUERY_KEY, predictionSetupId, 'monitoring', metricId, baseline?.configuredModel.name],
        queryFn: () => getPredictionSetupMonitoring(predictionSetupId, metricId, baseline?.configuredModel.name),
        enabled: !!metricId && isBaselineResolved,
        retry: 0,
    });
    const baselineDisplayName = baseline ? referenceName(baseline) : monitoring.data?.baselineModel ?? '';
    const error = catalog.error || monitoring.error;
    const series = monitoring.data ? monitoringSeries(monitoring.data) : undefined;
    const hasPoints = !!series && (series.evaluationPerSplit.length > 0 || series.perRun.length > 0);
    // Keep both sides of zero in view so the better and worse bands always show, whichever side the scores fall on.
    const extent = Math.max(0, ...(monitoring.data?.points ?? []).flatMap(point => [point.value, point.runningValue]).map(value => Math.abs(value ?? 0)));
    const verdict = (value: number) => (value > 0
        ? i18n.t('better than {{baseline}}', { baseline: baselineDisplayName })
        : value < 0
            ? i18n.t('worse than {{baseline}}', { baseline: baselineDisplayName })
            : i18n.t('same as {{baseline}}', { baseline: baselineDisplayName }));
    const options: Highcharts.Options = {
        chart: { type: 'line', height: 320, style: { fontFamily: 'inherit' } },
        title: { text: undefined },
        accessibility: { description: i18n.t('Evaluation compared with prediction performance over time, relative to a baseline model.') },
        exporting: { enabled: false },
        credits: { enabled: false },
        xAxis: { type: 'datetime', title: { text: i18n.t('Prediction origin period') } },
        yAxis: {
            title: { text: i18n.t('{{metric}} improvement over {{baseline}}', { metric: metric?.displayName, baseline: baselineDisplayName }) },
            labels: {
                formatter() {
                    return formatComparison(Number(this.value), metric);
                },
            },
            plotLines: [{ value: 0, color: colors.grey600, width: 1, zIndex: 2 }],
            plotBands: [
                {
                    from: 0,
                    to: Number.MAX_VALUE,
                    color: colors.green050,
                    label: {
                        text: i18n.t('Better than {{baseline}}', { baseline: baselineDisplayName }),
                        align: 'left',
                        verticalAlign: 'top',
                        x: 8,
                        y: 16,
                        style: { color: colors.green800, fontWeight: '600' },
                    },
                },
                {
                    from: -Number.MAX_VALUE,
                    to: 0,
                    color: colors.red050,
                    label: {
                        text: i18n.t('Worse than {{baseline}}', { baseline: baselineDisplayName }),
                        align: 'left',
                        verticalAlign: 'bottom',
                        x: 8,
                        y: -8,
                        style: { color: colors.red800, fontWeight: '600' },
                    },
                },
            ],
            softMax: extent * 0.15 || 0.1,
            softMin: -(extent * 0.15 || 0.1),
            // Room above and below the data for the band labels.
            minPadding: 0.2,
            maxPadding: 0.2,
            startOnTick: false,
            endOnTick: false,
        },
        tooltip: {
            shared: true,
            headerFormat: '<b>{point.key}</b><br/>',
            pointFormatter() {
                const value = this.y ?? 0;
                const color = value > 0 ? colors.green800 : value < 0 ? colors.red800 : colors.grey700;
                return `<span style="color:${this.color}">●</span> ${this.series.name}: <b style="color:${color}">${formatComparison(value, metric)}</b> (${verdict(value)})<br/>`;
            },
        },
        plotOptions: { series: { animation: false, marker: { enabled: true, radius: 3 } } },
        series: [
            {
                type: 'line',
                name: i18n.t('Evaluation per backtest split'),
                data: series?.evaluationPerSplit,
                color: '#a0adba',
                lineWidth: 1,
                showInLegend: !!series?.evaluationPerSplit.length,
            },
            {
                type: 'line',
                name: i18n.t('Evaluation running aggregate'),
                data: series?.evaluationRunning,
                color: '#6c7787',
                showInLegend: !!series?.evaluationRunning.length,
            },
            {
                type: 'line',
                name: i18n.t('Evaluation score'),
                marker: { enabled: false },
                data: series?.evaluation,
                color: '#6c7787',
                dashStyle: 'Dash',
                visible: monitoring.data?.evaluationValue != null,
                showInLegend: !!series?.evaluation.length && monitoring.data?.evaluationValue != null,
            },
            {
                type: 'line',
                name: i18n.t('Prediction per run'),
                data: series?.perRun,
                color: '#147cd7',
                showInLegend: !!series?.perRun.length,
            },
            {
                type: 'line',
                name: i18n.t('Prediction running aggregate'),
                data: series?.running,
                color: '#277314',
                showInLegend: !!series?.running.length,
            },
        ],
    };
    const noPredictionOutcomes = i18n.t('No observed prediction outcomes yet. Monitoring becomes available as later prediction runs supply observed values.');
    const isBaselineUnscored = !!baseline && baseline.status !== 'done';

    return (
        <Widget
            header={i18n.t('Model performance monitoring')}
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
        >
            <div className={styles.content}>
                <div className={styles.controls}>
                    {metrics.length > 0 && (
                        <SingleSelectField
                            dense
                            label={i18n.t('Metric')}
                            selected={metricId}
                            onChange={({ selected }) => setSelectedMetric(selected)}
                            helpText={metric?.description || undefined}
                        >
                            {metrics.map(item => <SingleSelectOption key={item.id} value={item.id} label={item.displayName} />)}
                        </SingleSelectField>
                    )}
                    {baselines.length > 0 && (
                        <SingleSelectField
                            dense
                            label={i18n.t('Compare with baseline')}
                            selected={baseline ? String(baseline.configuredModel.id) : undefined}
                            onChange={({ selected }) => setSelectedBaseline(selected)}
                            warning={isBaselineUnscored}
                            validationText={isBaselineUnscored ? baseline.message || i18n.t('No scores for this model yet.') : undefined}
                        >
                            {baselines.map(item => (
                                <SingleSelectOption key={item.configuredModel.id} value={String(item.configuredModel.id)} label={referenceLabel(item)} />
                            ))}
                        </SingleSelectField>
                    )}
                </div>
                {error ? (
                    <NoticeBox error title={i18n.t('Could not load monitoring')}>
                        {error instanceof ApiError && error.status === 404
                            ? i18n.t('Monitoring is unavailable for this prediction setup. Check that the Chap server supports prediction monitoring.')
                            : error instanceof ApiError && error.status === 422
                                ? i18n.t('This metric or baseline is not supported for monitoring. Choose another one.')
                                : getChapErrorMessage(error)}
                    </NoticeBox>
                ) : catalog.isLoading || !isBaselineResolved || monitoring.isInitialLoading ? (
                    <CircularLoader small />
                ) : metrics.length === 0 ? (
                    <p>{i18n.t('No metrics available for monitoring.')}</p>
                ) : !hasPoints ? (
                    <p>{noPredictionOutcomes}</p>
                ) : (
                    <>
                        <p className={styles.explanation}>
                            {i18n.t('Each point is a backtest split or prediction run, dated by the last period it had data for.')}
                        </p>
                        {monitoring.data?.evaluationValue == null && !!series?.perRun.length && (
                            <NoticeBox>{i18n.t('No evaluation score is available for this metric. Only prediction performance is shown.')}</NoticeBox>
                        )}
                        <HighchartsReact highcharts={Highcharts} options={options} />
                        {!series?.perRun.length && (
                            <p className={styles.explanation}>{noPredictionOutcomes}</p>
                        )}
                    </>
                )}
            </div>
        </Widget>
    );
};
