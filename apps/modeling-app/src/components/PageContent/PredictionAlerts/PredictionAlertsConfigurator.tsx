import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    IconInfo16,
    NoticeBox,
    Tooltip,
} from '@dhis2/ui';
import {
    buildOutbreakIndicators,
    buildOutbreakIndicatorsForSeries,
    calculateMockEndemicThreshold,
    MINIMUM_THRESHOLD_OBSERVATIONS,
    OUTBREAK_PROBABILITY_OPTIONS,
    OutbreakProbability,
    PredictionInfo,
    ModelSpecRead,
    UncertaintyAreaChart,
    Widget,
} from '@dhis2-chap/ui';
import { usePredictionSeries } from '../PredictionDetails/hooks/usePredictionSeries';
import styles from './PredictionAlerts.module.css';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
    selectedProbability: OutbreakProbability;
    onSelectProbability: (probability: OutbreakProbability) => void;
    density?: 'page' | 'dialog';
};

const SummaryLabel = ({
    label,
    tooltip,
}: {
    label: string;
    tooltip: string;
}) => (
    <dt className={styles.summaryLabel}>
        <span>{label}</span>
        <Tooltip
            content={tooltip}
            placement="top"
        >
            <span className={styles.tooltipIcon}>
                <IconInfo16 />
            </span>
        </Tooltip>
    </dt>
);

export const PredictionAlertsConfigurator = ({
    prediction,
    model,
    selectedProbability,
    onSelectProbability,
    density = 'page',
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
    const selectedIndicators = useMemo(() => (
        selectedSeries
            ? buildOutbreakIndicatorsForSeries(selectedSeries, selectedProbability)
            : []
    ), [selectedSeries, selectedProbability]);
    const allIndicators = useMemo(() => (
        buildOutbreakIndicators(series, selectedProbability)
    ), [series, selectedProbability]);
    const unavailableThresholdCount = useMemo(() => (
        series.filter(orgUnitSeries => (
            !calculateMockEndemicThreshold(orgUnitSeries.actualCases).available
        )).length
    ), [series]);
    const regionsWithAlerts = useMemo(() => (
        new Set(allIndicators
            .filter(indicator => indicator.outbreak)
            .map(indicator => indicator.orgUnitId)).size
    ), [allIndicators]);
    const alertPeriods = allIndicators.filter(indicator => indicator.outbreak).length;

    if (isLoading) {
        return (
            <Widget header={i18n.t('Alert preview')} noncollapsible>
                <div className={styles.loadingContainer}>
                    <CircularLoader />
                </div>
            </Widget>
        );
    }

    if (error) {
        return (
            <NoticeBox error title={i18n.t('Unable to load prediction data')}>
                {i18n.t('There was a problem loading the prediction data required for alert configuration.')}
            </NoticeBox>
        );
    }

    if (!selectedSeries) {
        return (
            <NoticeBox warning title={i18n.t('No prediction data found')}>
                {i18n.t('This prediction has no forecast data to configure alerts for.')}
            </NoticeBox>
        );
    }

    const probabilityControl = (
        <div className={styles.panelSection}>
            <h3>{i18n.t('Minimum outbreak probability')}</h3>
            <div className={styles.segmentedControl}>
                {OUTBREAK_PROBABILITY_OPTIONS.map(probability => (
                    <button
                        key={probability}
                        type="button"
                        className={[
                            styles.segmentButton,
                            probability === selectedProbability
                                ? styles.selectedSegmentButton
                                : '',
                        ].join(' ')}
                        onClick={() => onSelectProbability(probability)}
                    >
                        {`${probability}%`}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className={[
            styles.container,
            density === 'dialog' ? styles.dialogContainer : '',
        ].join(' ')}
        >
            {density === 'dialog' && (
                <div className={styles.dialogProbabilityControl}>
                    {probabilityControl}
                </div>
            )}
            <div className={styles.leftColumn}>
                <Widget header={density === 'dialog' ? ' ' : i18n.t('Alert preview')} noncollapsible>
                    <div className={[
                        styles.previewLayout,
                        density === 'dialog' ? styles.dialogPreviewLayout : '',
                    ].join(' ')}
                    >
                        <div className={styles.orgUnitList}>
                            {series.map((orgUnitSeries) => {
                                const threshold = calculateMockEndemicThreshold(orgUnitSeries.actualCases);
                                const indicators = buildOutbreakIndicatorsForSeries(
                                    orgUnitSeries,
                                    selectedProbability,
                                );
                                const hasOutbreak = indicators.some(indicator => indicator.outbreak);

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
                                        <span
                                            className={[
                                                styles.statusIndicator,
                                                !threshold.available
                                                    ? styles.statusUnavailable
                                                    : hasOutbreak
                                                        ? styles.statusYes
                                                        : styles.statusNo,
                                            ].join(' ')}
                                            aria-label={!threshold.available
                                                ? i18n.t('Threshold unavailable')
                                                : hasOutbreak
                                                    ? i18n.t('Outbreak')
                                                    : i18n.t('No outbreak')}
                                            title={!threshold.available
                                                ? i18n.t('Threshold unavailable')
                                                : hasOutbreak
                                                    ? i18n.t('Outbreak')
                                                    : i18n.t('No outbreak')}
                                        />
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
                            />
                        </div>
                    </div>
                </Widget>
            </div>
            {density === 'page' && (
                <div className={styles.rightColumn}>
                    <Widget header={i18n.t('Alert configuration')} noncollapsible>
                        <div className={styles.panelContent}>
                            {probabilityControl}
                            <dl className={styles.summaryList}>
                                <div>
                                    <SummaryLabel
                                        label={i18n.t('Regions with alerts')}
                                        tooltip={i18n.t('Number of regions with at least one forecast period marked as an outbreak.')}
                                    />
                                    <dd>{`${regionsWithAlerts} / ${series.length}`}</dd>
                                </div>
                                <div>
                                    <SummaryLabel
                                        label={i18n.t('Alert periods')}
                                        tooltip={i18n.t('Total number of alerts across all regions.')}
                                    />
                                    <dd>{alertPeriods}</dd>
                                </div>
                            </dl>
                            {unavailableThresholdCount > 0 && (
                                <NoticeBox warning title={i18n.t('Some thresholds are unavailable')}>
                                    {i18n.t('Outbreak indicators will be skipped for one region without enough historical data.', {
                                        count: unavailableThresholdCount,
                                        defaultValue_plural: 'Outbreak indicators will be skipped for {{count}} regions without enough historical data.',
                                    })}
                                </NoticeBox>
                            )}
                        </div>
                    </Widget>
                </div>
            )}
        </div>
    );
};
