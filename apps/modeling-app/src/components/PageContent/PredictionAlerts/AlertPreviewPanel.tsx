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
import type { ThresholdParams } from '@/utils/thresholdStrategyParams';
import {
    OutbreakProbabilityControl,
    ThresholdCalculationStatus,
} from '../../ThresholdTilesExplorer';
import { usePredictionSeries } from '../PredictionDetails/hooks/usePredictionSeries';
import styles from './PredictionAlerts.module.css';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
    thresholdParams: ThresholdParams;
    selectedProbability: OutbreakProbability;
    onSelectProbability: (probability: OutbreakProbability) => void;
};

export const AlertPreviewPanel = ({
    prediction,
    model,
    thresholdParams,
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

    const {
        thresholdMap,
        isLoading: isThresholdsLoading,
        isPaused: areThresholdsPaused,
        error: thresholdsError,
        refetch: refetchThresholds,
    } = useEndemicThresholds({
        datasetId: prediction.datasetId,
        series,
        params: thresholdParams,
    });

    // Only replace the panel with a spinner while nothing can be shown yet;
    // during a recalculation the previous thresholds stay visible
    // (keepPreviousData) with an inline calculating indicator instead.
    const isLoading = isSeriesLoading || (isThresholdsLoading && !areThresholdsPaused && !thresholdMap);

    const selectedSeries = series.find(s => s.orgUnitId === selectedOrgUnitId) ?? series[0];
    const selectedThresholds: EndemicThresholdPoint[] = useMemo(() => (
        thresholdMap?.get(selectedSeries?.orgUnitId) ?? []
    ), [thresholdMap, selectedSeries?.orgUnitId]);
    // One definition of "has a threshold" for the list and the selected chart,
    // matching the tile status: at least one forecast period can be evaluated.
    const orgUnitStatuses = useMemo(() => new Map(series.map((orgUnitSeries) => {
        const indicators = buildOutbreakIndicatorsForSeries(
            orgUnitSeries,
            selectedProbability,
            thresholdMap?.get(orgUnitSeries.orgUnitId),
        );

        return [orgUnitSeries.orgUnitId, {
            hasThreshold: indicators.length > 0,
            hasOutbreak: indicators.some(indicator => indicator.outbreak),
        }];
    })), [series, selectedProbability, thresholdMap]);
    const hasThreshold = !!selectedSeries && !!orgUnitStatuses.get(selectedSeries.orgUnitId)?.hasThreshold;
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
    const outbreakPeriods = useMemo(() => selectedIndicators.map(indicator => ({
        period: indicator.period,
        outbreak: indicator.outbreak,
        supportedProbability: indicator.supportedProbability,
        value: indicator.value,
    })), [selectedIndicators]);

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

    if (seriesError) {
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
            <ThresholdCalculationStatus
                isLoading={isThresholdsLoading}
                isPaused={areThresholdsPaused}
                error={thresholdsError}
                onRetry={refetchThresholds}
            />
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
                                const {
                                    hasThreshold: orgHasThreshold = false,
                                    hasOutbreak = false,
                                } = orgUnitStatuses.get(orgUnitSeries.orgUnitId) ?? {};
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
                                outbreakPeriods={outbreakPeriods}
                                maxY={selectedMaxY}
                            />
                        </div>
                    </div>
                </Widget>
            </div>
        </div>
    );
};
