import type { KeyboardEvent, MouseEvent } from 'react';
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
import {
    convertServerToClientPeriod,
    DEFAULT_OUTBREAK_PROBABILITY,
    getThresholdTileViewModels,
    PERIOD_TYPES,
    Tag,
} from '@dhis2-chap/ui';
import type {
    ModelSpecRead,
    OutbreakProbability,
    PredictionInfo,
} from '@dhis2-chap/ui';
import { useMemo } from 'react';
import {
    OutbreakProbabilityControl,
    SummaryRow,
    ThresholdTilesExplorer,
} from '../../../ThresholdTilesExplorer';
import { usePredictionSeries } from '../hooks/usePredictionSeries';
import styles from './PredictionDetailsGrid.module.css';

export type PredictionRunAlertSettings = {
    alertProbability: OutbreakProbability;
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
    alertProbability: DEFAULT_OUTBREAK_PROBABILITY,
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
        isLoading,
        error,
    } = usePredictionSeries({ prediction, model });
    const showThresholds = settings.thresholdsEnabled;

    const {
        summary,
        tiles,
    } = useMemo(() => (
        getThresholdTileViewModels(series, settings.alertProbability)
    ), [series, settings.alertProbability]);

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

    const toggleThresholds = () => {
        updateSettings({ thresholdsEnabled: !settings.thresholdsEnabled });
    };

    const handleThresholdKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleThresholds();
        }
    };

    const handleSwitchClick = (event: MouseEvent) => {
        event.stopPropagation();
    };

    const summaryList = (
        <dl className={styles.summaryList}>
            <SummaryRow
                label={i18n.t('Regions with alerts')}
                value={`${summary.regionsWithAlerts} / ${summary.totalRegions}`}
            />
            <SummaryRow
                label={i18n.t('Alert periods')}
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

            <div
                className={styles.toggleButton}
                onClick={toggleThresholds}
                onKeyDown={handleThresholdKeyDown}
                role="button"
                tabIndex={0}
            >
                <div className={styles.toggleText}>
                    <span className={styles.toggleTitle}>
                        {i18n.t('Outbreak thresholds')}
                    </span>
                    <span className={styles.toggleDescription}>
                        {i18n.t('Show outbreak status and threshold overlays for this run.')}
                    </span>
                </div>
                <span onClick={handleSwitchClick}>
                    <Switch
                        checked={settings.thresholdsEnabled}
                        onChange={toggleThresholds}
                    />
                </span>
            </div>
            {showThresholds && (
                <OutbreakProbabilityControl
                    selectedProbability={settings.alertProbability}
                    onSelectProbability={probability => updateSettings({ alertProbability: probability })}
                />
            )}
            {showThresholds && summaryList}
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
            tiles={tiles}
            showThresholds={showThresholds}
            panel={panelContent}
            panelHeader={i18n.t('Prediction settings')}
            gridResetKey={String(prediction.id)}
            zoomResetDeps={[prediction.id, settings.alertProbability, settings.thresholdsEnabled]}
        />
    );
};
