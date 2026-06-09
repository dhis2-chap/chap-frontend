import i18n from '@dhis2/d2-i18n';
import { CircularLoader } from '@dhis2/ui';
import type { PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import { Widget } from '@dhis2-chap/ui';
import styles from './SchedulingWidget.module.css';

type Props = {
    predictionSetup?: PredictionSetupReadWithPredictions;
    isLoading: boolean;
};

export const SchedulingWidget = ({
    predictionSetup,
    isLoading,
}: Props) => {
    const isScheduled = predictionSetup?.scheduleEnabled ?? false;

    return (
        <Widget
            header={i18n.t('Scheduling')}
            noncollapsible
        >
            {isLoading && (
                <div className={styles.loadingState}>
                    <CircularLoader small />
                </div>
            )}
            {!isLoading && !predictionSetup && (
                <div className={styles.emptyState}>
                    {i18n.t('No prediction setup found')}
                </div>
            )}
            {!isLoading && predictionSetup && (
                <div className={styles.content}>
                    <div className={styles.row}>
                        <span className={styles.label}>{i18n.t('Status')}</span>
                        <span
                            className={isScheduled ? styles.enabledValue : styles.disabledValue}
                            data-test="scheduling-status"
                        >
                            {isScheduled ? i18n.t('Enabled') : i18n.t('Disabled')}
                        </span>
                    </div>
                </div>
            )}
        </Widget>
    );
};
