import { useEffect, useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    NoticeBox,
    Tooltip,
} from '@dhis2/ui';
import {
    buildOutbreakIndicatorsForSeries,
    calculateMockEndemicThreshold,
    getStableMaxYForThresholdChart,
    MINIMUM_THRESHOLD_OBSERVATIONS,
    UncertaintyAreaChart,
    Widget,
} from '@dhis2-chap/ui';
import type {
    ModelSpecRead,
    OutbreakProbability,
    PredictionInfo,
} from '@dhis2-chap/ui';
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
        isLoading,
        error,
    } = usePredictionSeries({ prediction, model });

    const selectedSeries = series.find(s => s.orgUnitId === selectedOrgUnitId) ?? series[0];
    const selectedThreshold = useMemo(() => (
        calculateMockEndemicThreshold(selectedSeries?.actualCases)
    ), [selectedSeries]);
    const selectedMaxY = useMemo(() => (
        selectedSeries
            ? getStableMaxYForThresholdChart(selectedSeries, selectedThreshold.threshold)
            : undefined
    ), [selectedSeries, selectedThreshold.threshold]);
    const selectedIndicators = useMemo(() => (
        selectedSeries
            ? buildOutbreakIndicatorsForSeries(selectedSeries, selectedProbability)
            : []
    ), [selectedSeries, selectedProbability]);

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
                                const threshold = calculateMockEndemicThreshold(orgUnitSeries.actualCases);
                                const indicators = buildOutbreakIndicatorsForSeries(
                                    orgUnitSeries,
                                    selectedProbability,
                                );
                                const hasOutbreak = threshold.available &&
                                    indicators.some(indicator => indicator.outbreak);
                                const tooltipLabel = !threshold.available
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
                                        {!threshold.available && tooltipLabel && (
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
                            {!selectedThreshold.available && (
                                <NoticeBox warning title={i18n.t('Endemic threshold unavailable')}>
                                    {i18n.t('At least {{count}} historical observations are required for the mocked threshold.', {
                                        count: MINIMUM_THRESHOLD_OBSERVATIONS,
                                    })}
                                </NoticeBox>
                            )}
                            <UncertaintyAreaChart
                                predictionTargetName={predictionTargetName}
                                series={selectedSeries}
                                endemicThreshold={selectedThreshold.threshold}
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
