import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { useQuery } from '@tanstack/react-query';
import { ApiError, type PredictionSetupMonitoring, PredictionSetupsService } from '@dhis2-chap/ui';
import { Widget } from '@chap-blocks/ui/layout';
import { MonitoringChart } from '@chap-blocks/ui/charts';
import { ReferenceModelSelector } from '@/components/ModelComparisons/ReferenceModelSelector';
import { getSelectedReference, referenceName } from '@/components/ModelComparisons/referenceModels';
import { formatComparison, getDefaultMetricIds, HIDDEN_METRIC_IDS, sortMetricIds } from '@/components/PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import { useBacktestById } from '@/hooks/useBacktestById';
import { PREDICTION_SETUPS_QUERY_KEY } from '@/hooks/usePredictionSetups';
import { useBacktestSpecification } from '@/pages/BenchmarksPage/useBacktestSpecification';
import { getChapErrorMessage } from '@/utils/chapErrors';
import styles from './MonitoringWidget.module.css';

type Props = {
    predictionSetupId: number;
    evaluationId: number;
};

export const MonitoringWidget = ({ predictionSetupId, evaluationId }: Props) => {
    const [open, setOpen] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState('');
    const [selectedBaseline, setSelectedBaseline] = useState<string>();
    const { backtest, error: backtestError } = useBacktestById(evaluationId);
    const specification = useBacktestSpecification(backtest?.specificationId ?? 0);
    const catalog = specification.data?.metrics ?? [];
    // Monitoring compares every run with a baseline, so metrics without a comparison cannot be monitored.
    const metricIds = sortMetricIds(
        catalog.filter(metric => !HIDDEN_METRIC_IDS.includes(metric.id) && metric.comparisonOp != null).map(metric => metric.id),
        catalog,
    );
    const metrics = metricIds.map(id => catalog.find(metric => metric.id === id)!);
    // Defaults to the first metric selected in the modeling defaults, in their configured order.
    const metricId = selectedMetric || getDefaultMetricIds(metricIds, catalog)[0] || metricIds[0] || '';
    const metric = metrics.find(item => item.id === metricId);
    const baselines = specification.data?.baselines ?? [];
    // Without the specification's baselines, Chap Core falls back to its default baseline.
    const baseline = getSelectedReference(baselines, selectedBaseline, specification.data?.defaultBaselineModel);

    const monitoring = useQuery<PredictionSetupMonitoring, ApiError>({
        // The status refetches once a pending baseline finishes, since evaluation scores only come with a done baseline.
        queryKey: [PREDICTION_SETUPS_QUERY_KEY, predictionSetupId, 'monitoring', metricId, baseline?.configuredModel.name, baseline?.status],
        queryFn: () => PredictionSetupsService.getPredictionSetupMonitoringV1CrudPredictionSetupsPredictionSetupIdMonitoringGet(
            predictionSetupId,
            metricId,
            baseline?.configuredModel.name,
        ),
        enabled: !!metricId,
        retry: 0,
    });
    const baselineDisplayName = baseline ? referenceName(baseline) : monitoring.data?.baselineModel ?? '';
    const error = backtestError || specification.error || monitoring.error;

    return (
        <Widget
            header={i18n.t('Model performance monitoring')}
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
        >
            <div className={styles.content}>
                <p className={styles.explanation}>
                    {i18n.t('Each dot is one run, scored against the baseline once outcomes were observed. The prediction trend combines all prediction runs so far.')}
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
                ) : !specification.data || monitoring.isInitialLoading ? (
                    <CircularLoader small />
                ) : metrics.length === 0 ? (
                    <p>{i18n.t('No metrics available for monitoring.')}</p>
                ) : monitoring.data ? (
                    <MonitoringChart
                        monitoring={monitoring.data}
                        metricName={metric?.displayName}
                        baselineName={baselineDisplayName}
                        formatValue={value => formatComparison(value, metric)}
                    />
                ) : null}
            </div>
        </Widget>
    );
};
