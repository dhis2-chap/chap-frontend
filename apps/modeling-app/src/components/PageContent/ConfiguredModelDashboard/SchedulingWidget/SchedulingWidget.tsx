import i18n from '@dhis2/d2-i18n';
import { CircularLoader, Tooltip } from '@dhis2/ui';
import type { PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import { Widget } from '@dhis2-chap/ui';
import {
    getCronExpressionDescription,
    toFiveFieldCronExpression,
} from '@/utils/cronSchedule';
import styles from './SchedulingWidget.module.css';

const getScheduleViewModel = (predictionSetup?: PredictionSetupReadWithPredictions) => {
    if (!predictionSetup?.schedule?.enabled) {
        return {
            description: undefined,
            expression: i18n.t('Not scheduled'),
        };
    }

    const expression = toFiveFieldCronExpression(predictionSetup.schedule.expression);

    if (!expression) {
        return {
            description: undefined,
            expression: i18n.t('Not scheduled'),
        };
    }

    return {
        description: getCronExpressionDescription(expression),
        expression,
    };
};

type Props = {
    hasValidConfiguredId: boolean;
    isLoading: boolean;
    predictionSetup?: PredictionSetupReadWithPredictions;
};

export const SchedulingWidget = ({
    hasValidConfiguredId,
    isLoading,
    predictionSetup,
}: Props) => {
    const schedule = getScheduleViewModel(predictionSetup);

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
            {!isLoading && !hasValidConfiguredId && (
                <div className={styles.emptyState}>
                    {i18n.t('Invalid prediction setup')}
                </div>
            )}
            {!isLoading && hasValidConfiguredId && (
                <div className={styles.content}>
                    <div className={styles.grid}>
                        <div className={styles.item}>
                            <span className={styles.label}>{i18n.t('Schedule')}</span>
                            {schedule.description && (
                                <Tooltip content={schedule.description}>
                                    <span className={`${styles.value} ${styles.tooltipValue}`}>
                                        {schedule.expression}
                                    </span>
                                </Tooltip>
                            )}
                            {!schedule.description && (
                                <span className={styles.value}>{schedule.expression}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Widget>
    );
};
