import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
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
import { PREDICTION_SETUPS_QUERY_KEY } from '../../../../hooks/usePredictionSetups';
import { getChapErrorMessage } from '../../../../utils/chapErrors';
import { HIDDEN_METRIC_IDS } from '../../EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import { monitoringSeries } from './monitoringSeries';
import styles from './MonitoringWidget.module.css';

type Props = {
    predictionSetupId: number;
    evaluationId: number;
};

export const MonitoringWidget = ({ predictionSetupId, evaluationId }: Props) => {
    accessibility(Highcharts);
    const [selectedMetric, setSelectedMetric] = useState('');
    const catalog = useQuery<MetricInfo[], ApiError>({
        queryKey: ['evaluation-metric-catalog', evaluationId],
        queryFn: () => VisualizationsService.getAvailableMetricsV1VisualizationMetricsBacktestIdGet(evaluationId),
        staleTime: 5 * 60 * 1000,
        retry: 0,
    });
    const metrics = catalog.data?.filter(metric => !HIDDEN_METRIC_IDS.includes(metric.id)) ?? [];
    const metricId = selectedMetric || metrics.find(metric => metric.id === 'crps_log1p')?.id || metrics[0]?.id || '';
    const metric = metrics.find(item => item.id === metricId);
    const monitoring = useQuery<PredictionSetupMonitoring, ApiError>({
        queryKey: [PREDICTION_SETUPS_QUERY_KEY, predictionSetupId, 'monitoring', metricId],
        queryFn: () => getPredictionSetupMonitoring(predictionSetupId, metricId),
        enabled: !!metricId,
        retry: 0,
    });
    const error = catalog.error || monitoring.error;
    const series = monitoring.data ? monitoringSeries(monitoring.data) : undefined;
    const options: Highcharts.Options = {
        chart: { type: 'line', height: 320, style: { fontFamily: 'inherit' } },
        title: { text: undefined },
        accessibility: { description: i18n.t('Evaluation score compared with prediction performance over time.') },
        exporting: { enabled: false },
        credits: { enabled: false },
        xAxis: { type: 'datetime', title: { text: i18n.t('Prediction origin period') } },
        yAxis: { title: { text: metric?.displayName }, startOnTick: false },
        tooltip: { shared: true, headerFormat: '<b>{point.key}</b><br/>', valueDecimals: 3, valueSuffix: metric?.unit ? ` ${metric.unit}` : '' },
        plotOptions: { series: { animation: false, marker: { enabled: true, radius: 3 } } },
        series: [
            {
                type: 'line',
                name: i18n.t('Evaluation'),
                data: series?.evaluation,
                color: '#6c7787',
                dashStyle: 'Dash',
                visible: monitoring.data?.evaluationValue != null,
                showInLegend: monitoring.data?.evaluationValue != null,
            },
            { type: 'line', name: i18n.t('Per prediction run'), data: series?.perRun, color: '#147cd7' },
            { type: 'line', name: i18n.t('Running aggregate'), data: series?.running, color: '#277314' },
        ],
    };

    return (
        <Widget header={i18n.t('Model performance monitoring')} noncollapsible>
            <div className={styles.content}>
                {metrics.length > 0 && (
                    <SingleSelectField
                        label={i18n.t('Metric')}
                        selected={metricId}
                        onChange={({ selected }) => setSelectedMetric(selected)}
                        helpText={metric?.description || undefined}
                    >
                        {metrics.map(item => <SingleSelectOption key={item.id} value={item.id} label={item.displayName} />)}
                    </SingleSelectField>
                )}
                {error ? (
                    <NoticeBox error title={i18n.t('Could not load monitoring')}>
                        {error instanceof ApiError && error.status === 404
                            ? i18n.t('Monitoring is unavailable for this prediction setup. Check that the CHAP server supports prediction monitoring.')
                            : error instanceof ApiError && error.status === 422
                                ? i18n.t('This metric is not supported for monitoring. Choose another metric.')
                                : getChapErrorMessage(error)}
                    </NoticeBox>
                ) : catalog.isLoading || monitoring.isInitialLoading ? (
                    <CircularLoader small />
                ) : metrics.length === 0 ? (
                    <p>{i18n.t('No metrics available for monitoring.')}</p>
                ) : !series?.perRun.length ? (
                    <p>{i18n.t('No observed prediction outcomes yet. Monitoring becomes available as later prediction runs supply observed values.')}</p>
                ) : (
                    <>
                        <p className={styles.explanation}>
                            {i18n.t('Compare the evaluation score with prediction performance as observed outcomes arrive. Each point is a prediction run, dated by the last observed period used to make its forecast. The running aggregate combines scored predictions across runs.')}
                        </p>
                        {monitoring.data?.evaluationValue == null && (
                            <NoticeBox>{i18n.t('No evaluation score is available for this metric. Only prediction performance is shown.')}</NoticeBox>
                        )}
                        <HighchartsReact highcharts={Highcharts} options={options} />
                    </>
                )}
            </div>
        </Widget>
    );
};
