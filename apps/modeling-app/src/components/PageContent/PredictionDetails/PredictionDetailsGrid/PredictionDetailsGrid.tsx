import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    IconChevronRight16,
    IconImportItems24,
    NoticeBox,
    Switch,
} from '@dhis2/ui';
import { convertServerToClientPeriod, PERIOD_TYPES } from '@dhis2-chap/core';
import { DEFAULT_OUTBREAK_PROBABILITY, getThresholdTileViewModels, Tag } from '@dhis2-chap/ui';
import type {
    AlertPolicyRead,
    ModelSpecRead,
    OutbreakProbability,
    PredictionInfo,
} from '@dhis2-chap/ui';
import { useMemo } from 'react';
import { useAlertPolicyThresholds } from '@/hooks/useAlertPolicyThresholds';
import { usePredictionAlerts } from '@/hooks/usePredictionAlerts';
import { Features, useIsFeatureAvailable } from '@/hooks/useIsFeatureAvailable';
import { useEndemicThresholds } from '@/hooks/useEndemicThresholds';
import {
    DEFAULT_THRESHOLD_STRATEGY,
    getDefaultThresholdParams,
    type ThresholdParams,
} from '@/utils/thresholdStrategyParams';
import {
    OutbreakProbabilityControl,
    SummaryRow,
    ThresholdCalculationStatus,
    ThresholdStrategyControl,
    ThresholdTilesExplorer,
} from '../../../ThresholdTilesExplorer';
import { usePredictionSeries } from '../hooks/usePredictionSeries';
import { AlertLevelsSection } from './AlertLevelsSection';
import styles from './PredictionDetailsGrid.module.css';

export type PredictionRunAlertSettings = {
    alertsEnabled: boolean;
    alertProbability: OutbreakProbability;
    thresholdParams: ThresholdParams;
    thresholdsEnabled: boolean;
};

type Props = {
    model: ModelSpecRead;
    onImport: () => void;
    onSettingsChange: (settings: PredictionRunAlertSettings) => void;
    prediction: PredictionInfo;
    settings: PredictionRunAlertSettings;
};

const NO_POLICIES: AlertPolicyRead[] = [];

const DEFAULT_SETTINGS: PredictionRunAlertSettings = {
    alertsEnabled: true,
    alertProbability: DEFAULT_OUTBREAK_PROBABILITY,
    thresholdParams: getDefaultThresholdParams(DEFAULT_THRESHOLD_STRATEGY),
    thresholdsEnabled: false,
};

export const getDefaultPredictionRunAlertSettings = () => ({ ...DEFAULT_SETTINGS });

export const PredictionDetailsGrid = ({
    model,
    onImport,
    onSettingsChange,
    prediction,
    settings,
}: Props) => {
    const {
        series,
        predictionTargetName,
        isLoading: isSeriesLoading,
        error: seriesError,
    } = usePredictionSeries({ prediction, model });
    const { isAvailable: isAlertsAvailable } = useIsFeatureAvailable(Features.PREDICTION_ALERTS);
    const alerts = usePredictionAlerts(prediction, isAlertsAvailable);
    const showThresholds = settings.thresholdsEnabled;
    const showPolicy = isAlertsAvailable && settings.alertsEnabled && !showThresholds;
    const raisedAlerts = showPolicy && alerts.displayedAlerts.length > 0
        ? alerts.displayedAlerts
        : undefined;
    const policyThresholds = useAlertPolicyThresholds({
        datasetId: prediction.datasetId,
        series,
        policies: alerts.status.kind === 'raised' ? alerts.status.policies : NO_POLICIES,
        enabled: showPolicy,
    });

    const {
        thresholdMap,
        isLoading: isThresholdsLoading,
        isPaused: areThresholdsPaused,
        error: thresholdsError,
        refetch: refetchThresholds,
    } = useEndemicThresholds({
        datasetId: prediction.datasetId,
        series,
        params: settings.thresholdParams,
        enabled: showThresholds,
    });

    // During a recalculation the previous thresholds stay visible
    // (keepPreviousData), so the grid is not remounted and the status filter
    // survives a param change. Once exploration is off they are ignored.
    const activeThresholdMap = showThresholds ? thresholdMap : undefined;
    const thresholdsVisible = !!activeThresholdMap;

    const {
        summary,
        tiles,
    } = useMemo(() => (
        getThresholdTileViewModels(series, settings.alertProbability, activeThresholdMap)
    ), [series, settings.alertProbability, activeThresholdMap]);

    const predictionPeriods = useMemo(() => {
        const points = series[0]?.points ?? [];
        if (points.length === 0) {
            return undefined;
        }

        const periodType = prediction.dataset.periodType as keyof typeof PERIOD_TYPES;
        const first = convertServerToClientPeriod(points[0].period, periodType);
        const last = convertServerToClientPeriod(points[points.length - 1].period, periodType);

        return { first, last };
    }, [series, prediction.dataset.periodType]);

    const updateSettings = (nextSettings: Partial<PredictionRunAlertSettings>) => {
        onSettingsChange({
            ...settings,
            ...nextSettings,
        });
    };

    const summaryList = (
        <dl className={styles.summaryList}>
            <SummaryRow
                label={i18n.t('Organisation units exceeding threshold')}
                value={`${summary.regionsWithAlerts} / ${summary.totalRegions}`}
            />
            <SummaryRow
                label={i18n.t('Periods exceeding threshold')}
                value={summary.alertPeriods}
            />
            {summary.unavailableThresholds > 0 && (
                <SummaryRow
                    label={i18n.t('Thresholds unavailable')}
                    value={summary.unavailableThresholds}
                />
            )}
        </dl>
    );

    const panelContent = (
        <>
            {prediction.name && (
                <div className={styles.panelSection}>
                    <h3>{i18n.t('Prediction run')}</h3>
                    <p className={styles.targetName}>{prediction.name}</p>
                </div>
            )}

            {predictionPeriods && (
                <div className={styles.panelSection}>
                    <h3>{i18n.t('Prediction periods')}</h3>
                    <div className={styles.periodValues}>
                        <Tag variant="info">{predictionPeriods.first}</Tag>
                        {predictionPeriods.first !== predictionPeriods.last && (
                            <>
                                <IconChevronRight16 />
                                <Tag variant="info">{predictionPeriods.last}</Tag>
                            </>
                        )}
                    </div>
                </div>
            )}

            {isAlertsAvailable && (
                <AlertLevelsSection
                    alerts={alerts}
                    enabled={settings.alertsEnabled}
                    disabled={showThresholds}
                    onEnabledChange={alertsEnabled => updateSettings({ alertsEnabled })}
                />
            )}
            {showPolicy && (
                <ThresholdCalculationStatus
                    isLoading={policyThresholds.isLoading}
                    isPaused={policyThresholds.isPaused}
                    error={policyThresholds.error}
                    onRetry={policyThresholds.refetch}
                    hint={i18n.t('Edit the alert policy to change its thresholds.')}
                />
            )}
            <Switch
                className={styles.toggleButton}
                aria-label={i18n.t('Explore thresholds')}
                checked={settings.thresholdsEnabled}
                onChange={({ checked }) => updateSettings({ thresholdsEnabled: checked })}
                label={(
                    <span className={styles.toggleText}>
                        <span className={styles.toggleTitle}>{i18n.t('Explore thresholds')}</span>
                        <span className={styles.toggleDescription}>
                            {i18n.t('Try other threshold settings. Hides recorded alerts.')}
                        </span>
                    </span>
                )}
            />
            {showThresholds && (
                <>
                    <ThresholdStrategyControl
                        value={settings.thresholdParams}
                        onApply={thresholdParams => updateSettings({ thresholdParams })}
                    />
                    <ThresholdCalculationStatus
                        isLoading={isThresholdsLoading}
                        isPaused={areThresholdsPaused}
                        error={thresholdsError}
                        onRetry={refetchThresholds}
                    />
                    <OutbreakProbabilityControl
                        selectedProbability={settings.alertProbability}
                        onSelectProbability={probability => updateSettings({ alertProbability: probability })}
                    />
                    {thresholdsVisible && summaryList}
                </>
            )}
            <ButtonStrip end>
                <Button
                    small
                    primary
                    icon={<IconImportItems24 />}
                    onClick={onImport}
                >
                    {i18n.t('Import')}
                </Button>
            </ButtonStrip>
        </>
    );

    if (isSeriesLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (seriesError) {
        return (
            <NoticeBox error title={i18n.t('Unable to load prediction data')}>
                {i18n.t('There was a problem loading the prediction data required for this prediction run.')}
            </NoticeBox>
        );
    }

    if (tiles.length === 0) {
        return (
            <NoticeBox warning title={i18n.t('No prediction data found')}>
                {i18n.t('This prediction has no forecast data to display.')}
            </NoticeBox>
        );
    }

    return (
        <ThresholdTilesExplorer
            predictionTargetName={predictionTargetName}
            selectedProbability={settings.alertProbability}
            tiles={tiles}
            raisedAlerts={raisedAlerts}
            policyThresholdLines={showPolicy ? policyThresholds.linesByOrgUnit : undefined}
            showThresholds={thresholdsVisible}
            panel={panelContent}
            panelHeader={i18n.t('Prediction settings')}
            gridResetKey={String(prediction.id)}
        />
    );
};
