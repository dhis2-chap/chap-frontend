import i18n from '@dhis2/d2-i18n';
import { NoticeBox, Switch } from '@dhis2/ui';
import type { OutbreakProbability } from '@dhis2-chap/ui';
import type { KeyboardEvent, MouseEvent } from 'react';
import { DataItemSelect } from './DataItemSelect';
import styles from './QuantileMappingForm.module.css';

type Props = {
    useAlertOutputs: boolean;
    selectedProbability: OutbreakProbability;
    unavailableThresholdCount: number;
    outbreakIndicator?: string;
    outbreakIndicatorError?: string;
    onToggleAlertOutputs: () => void;
    onAdjustAlertProbability: () => void;
    onChangeOutbreakIndicator: (id: string | null) => void;
};

export const AlertOutputSection = ({
    useAlertOutputs,
    selectedProbability,
    unavailableThresholdCount,
    outbreakIndicator,
    outbreakIndicatorError,
    onToggleAlertOutputs,
    onAdjustAlertProbability,
    onChangeOutbreakIndicator,
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
                    {unavailableThresholdCount > 0 && (
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
                </>
            )}
        </div>
    );
};
