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
    ModelSpecRead,
    OutbreakProbability,
    PredictionInfo,
} from '@dhis2-chap/ui';
import { useMemo } from 'react';
import { usePredictionAlerts } from '@/hooks/usePredictionAlerts';
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
    const alerts = usePredictionAlerts(prediction.id);
    const showThresholds = settings.thresholdsEnabled;

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
    // survives a param change.
    const thresholdsVisible = showThresholds && !!thresholdMap;

    const {
        summary,
        tiles,
    } = useMemo(() => (
        getThresholdTileViewModels(series, settings.alertProbability, thresholdMap)
    ), [series, settings.alertProbability, thresholdMap]);

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
                label={i18n.t('Regions exceeding threshold')}
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

            <Switch
                className={styles.toggleButton}
                aria-label={i18n.t('Alert levels')}
                checked={settings.alertsEnabled}
                onChange={({ checked }) => updateSettings({ alertsEnabled: checked })}
                label={(
                    <span className={styles.toggleText}>
                        <span className={styles.toggleTitle}>{i18n.t('Alert levels')}</span>
                        <span className={styles.toggleDescription}>
                            {i18n.t('Show recorded alerts on the plots.')}
                        </span>
                    </span>
                )}
            />
            {settings.alertsEnabled && (
                alerts.isLoading ? <CircularLoader small /> : alerts.error ? (
                    <NoticeBox error title={i18n.t('Unable to load raised alerts')}>
                        <Button small onClick={() => alerts.refetch()}>{i18n.t('Retry')}</Button>
                    </NoticeBox>
                ) : alerts.displayError ? (
                    <NoticeBox warning title={i18n.t('Saved labels and colours could not be loaded')}>
                        {i18n.t('Alerts are shown with their original labels and default colours.')}
                    </NoticeBox>
                ) : null
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
                            {i18n.t('Explore threshold lines for this run.')}
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
            raisedAlerts={settings.alertsEnabled ? alerts.displayedAlerts : []}
            showStatusFilter={false}
            showThresholds={thresholdsVisible}
            panel={panelContent}
            panelHeader={i18n.t('Prediction settings')}
            gridResetKey={String(prediction.id)}
            zoomResetDeps={[
                prediction.id,
                settings.alertProbability,
                settings.thresholdsEnabled,
                settings.thresholdParams,
            ]}
        />
    );
};
