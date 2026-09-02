import i18n from '@dhis2/d2-i18n';
import { NoticeBox, Switch } from '@dhis2/ui';
import type { OutbreakProbability } from '@dhis2-chap/ui';
import type { KeyboardEvent, MouseEvent } from 'react';
import { ThresholdCalculationStatus } from '../../../ThresholdTilesExplorer';
import { DataItemSelect } from './DataItemSelect';
import styles from './QuantileMappingForm.module.css';

type Props = {
    useAlertOutputs: boolean;
    selectedProbability: OutbreakProbability;
    thresholdStrategyName?: string;
    thresholdParamsSummary?: string;
    unavailableThresholdCount: number;
    isThresholdsLoading: boolean;
    thresholdsError: boolean;
    outbreakIndicator?: string;
    outbreakIndicatorError?: string;
    endemicThreshold?: string;
    onToggleAlertOutputs: () => void;
    onAdjustAlertProbability: () => void;
    onChangeOutbreakIndicator: (id: string | null) => void;
    onChangeEndemicThreshold: (id: string | null) => void;
    onRetryThresholds?: () => void;
};

export const AlertOutputSection = ({
    useAlertOutputs,
    selectedProbability,
    thresholdStrategyName,
    thresholdParamsSummary,
    unavailableThresholdCount,
    isThresholdsLoading,
    thresholdsError,
    outbreakIndicator,
    outbreakIndicatorError,
    endemicThreshold,
    onToggleAlertOutputs,
    onAdjustAlertProbability,
    onChangeOutbreakIndicator,
    onChangeEndemicThreshold,
    onRetryThresholds,
}: Props) => {
    const handleAlertOutputKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggleAlertOutputs();
        }
    };

    const handleSwitchClick = (event: MouseEvent) => {
        event.stopPropagation();
    };

    return (
        <div className={styles.alertOutput}>
            <h3>{i18n.t('Alert output')}</h3>
            <div
                className={styles.alertOutputToggle}
                onClick={onToggleAlertOutputs}
                onKeyDown={handleAlertOutputKeyDown}
                role="button"
                tabIndex={0}
            >
                <div className={styles.alertOutputToggleText}>
                    <span className={styles.alertOutputToggleTitle}>
                        {i18n.t('Use alert outputs')}
                    </span>
                    <span className={styles.alertOutputToggleDescription}>
                        {i18n.t('Import outbreak indicator values.')}
                    </span>
                </div>
                <span onClick={handleSwitchClick}>
                    <Switch
                        checked={useAlertOutputs}
                        onChange={onToggleAlertOutputs}
                    />
                </span>
            </div>
            {useAlertOutputs && (
                <>
                    <ThresholdCalculationStatus
                        isLoading={isThresholdsLoading}
                        error={thresholdsError}
                        onRetry={onRetryThresholds}
                    />
                    {!isThresholdsLoading && !thresholdsError && unavailableThresholdCount > 0 && (
                        <NoticeBox warning title={i18n.t('Some outbreak indicators will be skipped')}>
                            {i18n.t('Outbreak indicators will be skipped for one region due to insufficient disease data.', {
                                count: unavailableThresholdCount,
                                defaultValue_plural: 'Outbreak indicators will be skipped for {{count}} regions due to insufficient disease data.',
                            })}
                        </NoticeBox>
                    )}
                    <div className={styles.alertSummary}>
                        <div>
                            <span className={styles.summaryLabel}>
                                {i18n.t('Minimum outbreak probability')}
                            </span>
                            <span className={styles.summaryValue}>
                                {`${selectedProbability}%`}
                            </span>
                        </div>
                        {thresholdStrategyName && (
                            <div>
                                <span className={styles.summaryLabel}>
                                    {i18n.t('Threshold strategy')}
                                </span>
                                <span className={styles.summaryValue}>
                                    {thresholdStrategyName}
                                </span>
                            </div>
                        )}
                        {thresholdParamsSummary && (
                            <div>
                                <span className={styles.summaryLabel}>
                                    {i18n.t('Threshold parameters')}
                                </span>
                                <span className={styles.summaryValue}>
                                    {thresholdParamsSummary}
                                </span>
                            </div>
                        )}
                        <button
                            type="button"
                            className={styles.tertiaryActionButton}
                            onClick={onAdjustAlertProbability}
                        >
                            {i18n.t('Adjust')}
                        </button>
                    </div>
                    <div className={styles.outbreakIndicatorField}>
                        <DataItemSelect
                            label={i18n.t('Outbreak indicator')}
                            value={outbreakIndicator}
                            onChange={onChangeOutbreakIndicator}
                            error={outbreakIndicatorError}
                        />
                    </div>
                    <div className={styles.outbreakIndicatorField}>
                        <DataItemSelect
                            label={i18n.t('Endemic threshold (optional)')}
                            value={endemicThreshold}
                            onChange={onChangeEndemicThreshold}
                        />
                    </div>
                </>
            )}
        </div>
    );
};
