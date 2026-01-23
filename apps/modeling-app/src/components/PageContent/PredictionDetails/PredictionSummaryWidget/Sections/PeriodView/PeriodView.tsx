import i18n from '@dhis2/d2-i18n';
import { convertServerToClientPeriod, PERIOD_TYPES, Tag } from '@dhis2-chap/ui';
import styles from '../../PredictionSummaryWidget.module.css';
import { IconChevronRight16 } from '@dhis2/ui';
import clsx from 'clsx';

type Props = {
    periodType?: string | null;
    firstPeriod?: string | null;
    lastPeriod?: string | null;
    nPeriods?: number;
};

const PeriodTypeToLabels = {
    [PERIOD_TYPES.DAY]: i18n.t('Daily'),
    [PERIOD_TYPES.WEEK]: i18n.t('Weekly'),
    [PERIOD_TYPES.MONTH]: i18n.t('Monthly'),
} as const;

const periodConverter = (period: string | null | undefined, periodType: string | null | undefined) => {
    if (!period || !periodType) {
        return undefined;
    }
    try {
        return convertServerToClientPeriod(period, periodType as keyof typeof PERIOD_TYPES);
    } catch (error) {
        console.error('Failed to convert period id to extended ISO8601 format:', error);
        return period;
    }
};

export const PeriodView = ({ periodType, firstPeriod, lastPeriod, nPeriods }: Props) => {
    return (
        <>
            {periodType && (
                <div className={styles.row}>
                    <span className={styles.label}>
                        {i18n.t('Period type')}
                    </span>
                    <span className={styles.value}>
                        {PeriodTypeToLabels[periodType.toUpperCase() as keyof typeof PeriodTypeToLabels]}
                    </span>
                </div>
            )}
            <div className={styles.row}>
                <span className={styles.label}>
                    {i18n.t('Training period')}
                </span>
                <span className={clsx(styles.value, styles.periodValues)}>
                    {firstPeriod && (
                        <Tag variant="info">
                            {periodConverter(firstPeriod, periodType)}
                        </Tag>
                    )}
                    {firstPeriod && lastPeriod && (
                        <IconChevronRight16 />
                    )}
                    {lastPeriod && (
                        <Tag variant="info">
                            {periodConverter(lastPeriod, periodType)}
                        </Tag>
                    )}
                </span>
            </div>
            {nPeriods && (
                <div className={styles.row}>
                    <span className={styles.label}>
                        {i18n.t('Predicted periods')}
                    </span>
                    <span className={styles.value}>
                        {nPeriods}
                    </span>
                </div>
            )}
        </>
    );
};
