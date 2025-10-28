import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { Widget } from '@dhis2-chap/ui';
import styles from './EvaluationSummaryWidget.module.css';
import { useBacktestById } from '@/hooks/useBacktestById';
import { CircularLoader, IconArrowRight16, IconChevronRight16, NoticeBox } from '@dhis2/ui';
import { convertServerToClientPeriod } from '@/utils/timePeriodUtils';
import { PERIOD_TYPES } from '@/components/ModelExecutionForm';

type Props = {
    evaluationId: number;
};

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

const WidgetWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <Widget
            header={i18n.t('Summary')}
            noncollapsible
        >
            {children}
        </Widget>
    );
};

export const EvaluationSummaryWidget = ({ evaluationId }: Props) => {
    const { backtest, isLoading, error } = useBacktestById(evaluationId);

    if (isLoading) {
        return (
            <WidgetWrapper>
                <div className={styles.loadingContainer}>
                    <CircularLoader />
                </div>
            </WidgetWrapper>
        );
    }

    if (error || !backtest) {
        return (
            <WidgetWrapper>
                <div className={styles.errorContainer}>
                    <p>
                        {i18n.t('There was an error loading the evaluation summary. Please try again later.')}
                    </p>
                </div>
            </WidgetWrapper>
        );
    }

    return (
        <div className={styles.container}>
            <WidgetWrapper>
                <div className={styles.content}>
                    <div className={styles.row}>
                        <span className={styles.label}>
                            {i18n.t('Name')}
                        </span>
                        <span className={styles.value}>
                            {backtest.name}
                        </span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>
                            {i18n.t('Model')}
                        </span>
                        <span className={styles.value}>
                            {backtest.configuredModel.name}
                        </span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>
                            {i18n.t('Period')}
                        </span>
                        <span className={styles.value}>
                            {periodConverter(backtest.dataset.firstPeriod, backtest.dataset.periodType)}
                            {backtest.dataset.firstPeriod && backtest.dataset.lastPeriod && (
                                <span style={{ marginInline: '4px', paddingTop: '4px' }}>
                                    <IconChevronRight16 />
                                </span>
                            )}
                            {periodConverter(backtest.dataset.lastPeriod, backtest.dataset.periodType)}
                        </span>
                    </div>
                </div>
            </WidgetWrapper>
        </div>
    );
};
