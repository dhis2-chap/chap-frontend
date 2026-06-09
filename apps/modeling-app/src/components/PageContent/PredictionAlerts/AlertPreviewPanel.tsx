import { useEffect, useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    NoticeBox,
    Tooltip,
} from '@dhis2/ui';
import {
    buildOutbreakIndicatorsForSeries,
    getStableMaxYForThresholdChart,
    UncertaintyAreaChart,
    Widget,
} from '@dhis2-chap/ui';
import type {
    EndemicThresholdPoint,
    ModelSpecRead,
    OutbreakProbability,
    PredictionInfo,
} from '@dhis2-chap/ui';
import { useEndemicThresholds } from '@/hooks/useEndemicThresholds';
import { OutbreakProbabilityControl } from '../../ThresholdTilesExplorer';
import { usePredictionSeries } from '../PredictionDetails/hooks/usePredictionSeries';
import styles from './PredictionAlerts.module.css';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
    selectedProbability: OutbreakProbability;
    onSelectProbability: (probability: OutbreakProbability) => void;
};

export const AlertPreviewPanel = ({
    prediction,
    model,
    selectedProbability,
    onSelectProbability,
}: Props) => {
    const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string | undefined>(undefined);
    const {
        series,
        predictionTargetName,
        isLoading: isSeriesLoading,
        error: seriesError,
    } = usePredictionSeries({ prediction, model });

    const allPeriods = useMemo(() => {
        const periodSet = new Set<string>();
        for (const s of series) {
            s.actualCases?.forEach(ac => periodSet.add(ac.period));
            s.points.forEach(p => periodSet.add(p.period));
        }
        return Array.from(periodSet);
    }, [series]);

    const orgUnitIds = useMemo(() => (
        series.map(s => s.orgUnitId)
    ), [series]);

    const {
        thresholdMap,
        isLoading: isThresholdsLoading,
        error: thresholdsError,
    } = useEndemicThresholds({
        datasetId: prediction.datasetId,
        periodIds: allPeriods,
        locations: orgUnitIds,
        enabled: series.length > 0,
    });

    const isLoading = isSeriesLoading || isThresholdsLoading;
    const error = seriesError || thresholdsError;

    const selectedSeries = series.find(s => s.orgUnitId === selectedOrgUnitId) ?? series[0];
    const selectedThresholds: EndemicThresholdPoint[] = useMemo(() => (
        thresholdMap?.get(selectedSeries?.orgUnitId) ?? []
    ), [thresholdMap, selectedSeries?.orgUnitId]);
    const hasThreshold = selectedThresholds.some(t => t.value !== null);
    const selectedMaxY = useMemo(() => (
        selectedSeries
            ? getStableMaxYForThresholdChart(
                    selectedSeries,
                    selectedThresholds.length > 0 ? selectedThresholds : null,
                )
            : undefined
    ), [selectedSeries, selectedThresholds]);
    const selectedIndicators = useMemo(() => (
        selectedSeries
            ? buildOutbreakIndicatorsForSeries(
                    selectedSeries,
                    selectedProbability,
                    selectedThresholds.length > 0 ? selectedThresholds : undefined,
                )
            : []
    ), [selectedSeries, selectedProbability, selectedThresholds]);

    useEffect(() => {
        setSelectedOrgUnitId(undefined);
    }, [prediction.id]);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (error) {
        return (
            <NoticeBox error title={i18n.t('Unable to load prediction data')}>
                {i18n.t('There was a problem loading the prediction data required for alert configuration.')}
            </NoticeBox>
        );
    }

    if (!selectedSeries || series.length === 0) {
        return (
            <NoticeBox warning title={i18n.t('No prediction data found')}>
                {i18n.t('This prediction has no forecast data to configure alerts for.')}
            </NoticeBox>
        );
    }

    return (
        <div className={[styles.container, styles.dialogContainer].join(' ')}>
            <div className={styles.dialogProbabilityControl}>
                <OutbreakProbabilityControl
                    selectedProbability={selectedProbability}
                    onSelectProbability={onSelectProbability}
                    compact
                />
            </div>
            <div className={styles.leftColumn}>
                <Widget header=" " noncollapsible>
                    <div className={[styles.previewLayout, styles.dialogPreviewLayout].join(' ')}>
                        <div className={styles.orgUnitList}>
                            {series.map((orgUnitSeries) => {
                                const orgThresholds = thresholdMap?.get(orgUnitSeries.orgUnitId) ?? [];
                                const orgHasThreshold = orgThresholds.some(t => t.value !== null);
                                const indicators = buildOutbreakIndicatorsForSeries(
                                    orgUnitSeries,
                                    selectedProbability,
                                    orgThresholds.length > 0 ? orgThresholds : undefined,
                                );
                                const hasOutbreak = orgHasThreshold &&
                                    indicators.some(indicator => indicator.outbreak);
                                const tooltipLabel = !orgHasThreshold
                                    ? i18n.t('Threshold unavailable')
                                    : hasOutbreak
                                        ? i18n.t('Outbreak detected')
                                        : null;

                                return (
                                    <button
                                        key={orgUnitSeries.orgUnitId}
                                        type="button"
                                        className={[
                                            styles.orgUnitButton,
                                            selectedSeries.orgUnitId === orgUnitSeries.orgUnitId
                                                ? styles.selectedOrgUnitButton
                                                : '',
                                        ].join(' ')}
                                        onClick={() => setSelectedOrgUnitId(orgUnitSeries.orgUnitId)}
                                    >
                                        <span className={styles.orgUnitName}>
                                            {orgUnitSeries.orgUnitName}
                                        </span>
                                        {hasOutbreak && tooltipLabel && (
                                            <Tooltip content={tooltipLabel}>
                                                <span
                                                    className={[
                                                        styles.statusIndicator,
                                                        styles.statusOutbreak,
                                                    ].join(' ')}
                                                    aria-label={tooltipLabel}
                                                />
                                            </Tooltip>
                                        )}
                                        {!orgHasThreshold && tooltipLabel && (
                                            <Tooltip content={tooltipLabel}>
                                                <span
                                                    className={[
                                                        styles.statusIndicator,
                                                        styles.statusUnavailable,
                                                    ].join(' ')}
                                                    aria-label={tooltipLabel}
                                                />
                                            </Tooltip>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className={styles.chartArea}>
                            {!hasThreshold && (
                                <NoticeBox warning title={i18n.t('Endemic threshold unavailable')}>
                                    {i18n.t('Insufficient historical data to compute the endemic threshold for this location.')}
                                </NoticeBox>
                            )}
                            <UncertaintyAreaChart
                                predictionTargetName={predictionTargetName}
                                series={selectedSeries}
                                endemicThresholds={selectedThresholds.length > 0 ? selectedThresholds : undefined}
                                outbreakPeriods={selectedIndicators.map(indicator => ({
                                    period: indicator.period,
                                    outbreak: indicator.outbreak,
                                    supportedProbability: indicator.supportedProbability,
                                    value: indicator.value,
                                }))}
                                maxY={selectedMaxY}
                            />
                        </div>
                    </div>
                </Widget>
            </div>
        </div>
    );
};
