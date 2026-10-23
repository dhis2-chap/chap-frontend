import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox, Switch } from '@dhis2/ui';
import type { AlertPolicyRead, ApiError, OutbreakProbability } from '@dhis2-chap/ui';
import type { KeyboardEvent, MouseEvent } from 'react';
import { ThresholdCalculationStatus } from '../../../ThresholdTilesExplorer';
import { DataItemSelect } from './DataItemSelect';
import styles from './QuantileMappingForm.module.css';
import type { usePolicyOutbreakIndicators } from '@/hooks/usePolicyOutbreakIndicators';

type Props = {
    policy?: AlertPolicyRead | null;
    policyOutputs: ReturnType<typeof usePolicyOutbreakIndicators>;
    useAlertOutputs: boolean;
    selectedProbability: OutbreakProbability;
    thresholdStrategyName?: string;
    thresholdParamsSummary: string;
    unavailableThresholdCount: number;
    isThresholdsLoading: boolean;
    areThresholdsPaused: boolean;
    thresholdsError: ApiError | null;
    outbreakIndicator?: string;
    outbreakIndicatorError?: string;
    endemicThreshold?: string;
    onToggleAlertOutputs: () => void;
    onAdjustAlertProbability: () => void;
    onChangeOutbreakIndicator: (id: string | null) => void;
    onChangeEndemicThreshold: (id: string | null) => void;
    onRetryThresholds?: () => void;
};

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
    <div>
        <span className={styles.summaryLabel}>
            {label}
        </span>
        <span className={styles.summaryValue}>
            {value}
        </span>
    </div>
);

export const AlertOutputSection = ({
    policy,
    policyOutputs,
    useAlertOutputs,
    selectedProbability,
    thresholdStrategyName,
    thresholdParamsSummary,
    unavailableThresholdCount,
    isThresholdsLoading,
    areThresholdsPaused,
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
                    {policy ? (
                        <>
                            <SummaryItem label={i18n.t('Alert policy')} value={policy.name} />
                            <p>{i18n.t('Calculate the highest alert level from the forecast using this policy. Missing results are skipped.')}</p>
                            {policyOutputs.isLoading && <CircularLoader small />}
                            {!!policyOutputs.error && (
                                <NoticeBox error title={i18n.t('Unable to load policy alert outputs')}>
                                    <Button small onClick={policyOutputs.retry}>{i18n.t('Retry')}</Button>
                                </NoticeBox>
                            )}
                            {policyOutputs.codes && (
                                <div className={styles.alertSummary}>
                                    <SummaryItem label={i18n.t('No alert')} value={policyOutputs.codes.noAlert} />
                                    {(policy.levels ?? []).map(level => (
                                        <SummaryItem key={level.name} label={level.name} value={policyOutputs.codes!.levels[level.name]} />
                                    ))}
                                </div>
                            )}
                            <p>{i18n.t('Output codes can be changed on the Alert policies page.')}</p>
                            {policyOutputs.isReady && policyOutputs.skippedCount > 0 && (
                                <NoticeBox warning>
                                    {i18n.t('One region-period result is missing and will be skipped.', {
                                        count: policyOutputs.skippedCount,
                                        defaultValue_plural: '{{count}} region-period results are missing and will be skipped.',
                                    })}
                                </NoticeBox>
                            )}
                        </>
                    ) : (
                        <>
                            <ThresholdCalculationStatus
                                isLoading={isThresholdsLoading}
                                isPaused={areThresholdsPaused}
                                error={thresholdsError}
                                onRetry={onRetryThresholds}
                            />
                            {!isThresholdsLoading && !thresholdsError && unavailableThresholdCount > 0 && (
                                <NoticeBox warning title={i18n.t('Some outbreak indicators will be skipped')}>
                                    {i18n.t('One region has forecast periods without thresholds. Only outbreak indicators for those periods will be skipped; indicators for periods with thresholds will still be imported.', {
                                        count: unavailableThresholdCount,
                                        defaultValue_plural: '{{count}} regions have forecast periods without thresholds. Only outbreak indicators for those periods will be skipped; indicators for periods with thresholds will still be imported.',
                                    })}
                                </NoticeBox>
                            )}
                            <div className={styles.alertSummary}>
                                <SummaryItem
                                    label={i18n.t('Minimum outbreak probability')}
                                    value={`${selectedProbability}%`}
                                />
                                {thresholdStrategyName && (
                                    <SummaryItem
                                        label={i18n.t('Threshold strategy')}
                                        value={thresholdStrategyName}
                                    />
                                )}
                                <SummaryItem
                                    label={i18n.t('Threshold parameters')}
                                    value={thresholdParamsSummary}
                                />
                                <button
                                    type="button"
                                    className={styles.tertiaryActionButton}
                                    onClick={onAdjustAlertProbability}
                                >
                                    {i18n.t('Adjust')}
                                </button>
                            </div>
                        </>
                    )}
                    <div className={styles.outbreakIndicatorField}>
                        <DataItemSelect
                            label={i18n.t('Outbreak indicator')}
                            value={outbreakIndicator}
                            onChange={onChangeOutbreakIndicator}
                            error={outbreakIndicatorError}
                        />
                    </div>
                    {!policy && (
                        <div className={styles.outbreakIndicatorField}>
                            <DataItemSelect
                                label={i18n.t('Endemic threshold (optional)')}
                                value={endemicThreshold}
                                onChange={onChangeEndemicThreshold}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
