import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader, colors, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    type MetricInfo,
    type PredictionSetupMonitoring,
    PredictionSetupsService,
    VisualizationsService,
    Widget,
} from '@dhis2-chap/ui';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ReferenceModelSelector } from '@/components/ModelComparisons/ReferenceModelSelector';
import { getSelectedReference, referenceName } from '@/components/ModelComparisons/referenceModels';
import { formatComparison, HIDDEN_METRIC_IDS } from '@/components/PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import { useBacktestById } from '@/hooks/useBacktestById';
import { PREDICTION_SETUPS_QUERY_KEY } from '@/hooks/usePredictionSetups';
import { useBacktestSpecification } from '@/pages/BenchmarksPage/useBacktestSpecification';
import { getChapErrorMessage } from '@/utils/chapErrors';
import { monitoringSeries } from './monitoringSeries';
import styles from './MonitoringWidget.module.css';

type Props = {
    predictionSetupId: number;
    evaluationId: number;
};

export const MonitoringWidget = ({ predictionSetupId, evaluationId }: Props) => {
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
        queryFn: () => PredictionSetupsService.getPredictionSetupMonitoringV1CrudPredictionSetupsPredictionSetupIdMonitoringGet(
            predictionSetupId,
            metricId,
            baseline?.configuredModel.name,
        ),
        enabled: !!metricId && isBaselineResolved,
        retry: 0,
    });
    const baselineDisplayName = baseline ? referenceName(baseline) : monitoring.data?.baselineModel ?? '';
    const error = catalog.error || monitoring.error;
    const series = monitoring.data ? monitoringSeries(monitoring.data) : undefined;
    const hasPoints = !!series && (series.evaluationPerSplit.length > 0 || series.perRun.length > 0);
    // Keep both sides of zero in view so the better and worse bands always show, whichever side the scores fall on.
    const extent = Math.max(0, ...(monitoring.data?.points ?? []).flatMap(point => [point.value, point.runningValue]).map(value => Math.abs(value ?? 0)));
    const options: Highcharts.Options = {
        chart: { type: 'line', height: 320, style: { fontFamily: 'inherit' } },
        title: { text: undefined },
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
                return `<span style="color:${this.color}">●</span> ${this.series.name}: <b style="color:${color}">${formatComparison(value, metric)}</b><br/>`;
            },
        },
        plotOptions: { series: { animation: false, marker: { enabled: true, radius: 3 } } },
        series: [
            {
                type: 'line',
                name: i18n.t('Evaluation per backtest split'),
                data: series?.evaluationPerSplit,
                color: colors.grey500,
                lineWidth: 1,
                showInLegend: !!series?.evaluationPerSplit.length,
            },
            {
                type: 'line',
                name: i18n.t('Evaluation running aggregate'),
                data: series?.evaluationRunning,
                color: colors.grey600,
                showInLegend: !!series?.evaluationRunning.length,
            },
            {
                type: 'line',
                name: i18n.t('Evaluation score'),
                marker: { enabled: false },
                data: series?.evaluation,
                color: colors.grey600,
                dashStyle: 'Dash',
                showInLegend: !!series?.evaluation.length,
            },
            {
                type: 'line',
                name: i18n.t('Prediction per run'),
                data: series?.perRun,
                color: colors.blue600,
                showInLegend: !!series?.perRun.length,
            },
            {
                type: 'line',
                name: i18n.t('Prediction running aggregate'),
                data: series?.running,
                color: colors.green700,
                showInLegend: !!series?.running.length,
            },
        ],
    };
    const noPredictionOutcomes = i18n.t('No observed prediction outcomes yet.');

    return (
        <Widget
            header={i18n.t('Model performance monitoring')}
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
        >
            <div className={styles.content}>
                <p className={styles.explanation}>
                    {i18n.t('How each prediction run scored against a baseline once outcomes were observed, compared with the evaluation.')}
                </p>
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
                        <ReferenceModelSelector
                            hideNone
                            label={i18n.t('Compare with baseline')}
                            references={baselines}
                            reference={baseline}
                            onSelect={setSelectedBaseline}
                        />
                    )}
                </div>
                {error ? (
                    <NoticeBox error title={i18n.t('Could not load monitoring')}>
                        {getChapErrorMessage(error)}
                    </NoticeBox>
                ) : catalog.isLoading || !isBaselineResolved || monitoring.isInitialLoading ? (
                    <CircularLoader small />
                ) : metrics.length === 0 ? (
                    <p>{i18n.t('No metrics available for monitoring.')}</p>
                ) : !hasPoints ? (
                    <p>{noPredictionOutcomes}</p>
                ) : (
                    <>
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
