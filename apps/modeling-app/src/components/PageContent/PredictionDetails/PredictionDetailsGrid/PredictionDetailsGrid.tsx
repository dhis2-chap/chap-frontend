import type { KeyboardEvent, MouseEvent } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    IconImportItems24,
    NoticeBox,
    Switch,
} from '@dhis2/ui';
import {
    DEFAULT_OUTBREAK_PROBABILITY,
    getThresholdTileViewModels,
    OUTBREAK_PROBABILITY_OPTIONS,
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
    isEditing: boolean;
    model: ModelSpecRead;
    onCancel: () => void;
    onEdit: () => void;
    onImport: () => void;
    onSave: () => void;
    onSettingsChange: (settings: PredictionRunAlertSettings) => void;
    prediction: PredictionInfo;
    settings: PredictionRunAlertSettings;
};

const DEFAULT_SETTINGS: PredictionRunAlertSettings = {
    alertProbability: DEFAULT_OUTBREAK_PROBABILITY,
    thresholdsEnabled: true,
};

export const getDefaultPredictionRunAlertSettings = () => ({ ...DEFAULT_SETTINGS });

export const PredictionDetailsGrid = ({
    isEditing,
    model,
    onCancel,
    onEdit,
    onImport,
    onSave,
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
            <div className={styles.panelSection}>
                <h3>{i18n.t('Prediction target')}</h3>
                <p className={styles.targetName}>{predictionTargetName}</p>
            </div>

            {isEditing
                ? (
                        <>
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
                                    onClick={onCancel}
                                >
                                    {i18n.t('Cancel')}
                                </Button>
                                <Button
                                    small
                                    primary
                                    onClick={onSave}
                                >
                                    {i18n.t('Save')}
                                </Button>
                            </ButtonStrip>
                        </>
                    )
                : (
                        <>
                            <dl className={styles.summaryList}>
                                <SummaryRow
                                    label={i18n.t('Outbreak thresholds')}
                                    value={showThresholds ? i18n.t('Enabled') : i18n.t('Disabled')}
                                />
                                {showThresholds && (
                                    <SummaryRow
                                        label={i18n.t('Minimum outbreak probability')}
                                        value={`${settings.alertProbability}%`}
                                    />
                                )}
                            </dl>
                            {showThresholds && summaryList}
                            <ButtonStrip end>
                                <Button
                                    small
                                    onClick={onEdit}
                                >
                                    {i18n.t('Edit')}
                                </Button>
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
                    )}
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