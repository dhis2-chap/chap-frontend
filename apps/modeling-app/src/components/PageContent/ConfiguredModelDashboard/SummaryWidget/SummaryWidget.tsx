import i18n from '@dhis2/d2-i18n';
import { CircularLoader } from '@dhis2/ui';
import type { PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import { Widget } from '@dhis2-chap/ui';
import { format } from 'date-fns';
import styles from './SummaryWidget.module.css';

const EMPTY_VALUE = '-';

const formatDate = (created?: string | null) => (
    created ? format(new Date(created), 'dd.MM.yyyy') : EMPTY_VALUE
);

const formatCount = (count: number, singular: string, plural: string) => (
    i18n.t('{{count}} {{label}}', {
        count,
        label: count === 1 ? singular : plural,
    })
);

const formatPeriodType = (periodType?: string | null) => {
    const normalizedPeriodType = periodType?.toLowerCase();

    if (normalizedPeriodType === 'month') {
        return i18n.t('Monthly');
    }

    if (normalizedPeriodType === 'week') {
        return i18n.t('Weekly');
    }

    return periodType || EMPTY_VALUE;
};

const getModelName = (
    predictionSetup: PredictionSetupReadWithPredictions,
) => (
    predictionSetup.configuredModelWithDataSource.configuredModel?.modelTemplate?.displayName
    || predictionSetup.configuredModelWithDataSource.configuredModel?.name
    || EMPTY_VALUE
);

type Props = {
    predictionSetup?: PredictionSetupReadWithPredictions;
    isLoading: boolean;
};

export const SummaryWidget = ({
    predictionSetup,
    isLoading,
}: Props) => (
    <Widget
        header={i18n.t('Configuration')}
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
                    <span className={styles.label}>{i18n.t('Name')}</span>
                    <span className={styles.value}>{predictionSetup.name}</span>
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>{i18n.t('Model')}</span>
                    <span className={styles.value}>{getModelName(predictionSetup)}</span>
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>{i18n.t('Period type')}</span>
                    <span className={styles.value}>
                        {formatPeriodType(predictionSetup.configuredModelWithDataSource.periodType)}
                    </span>
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>{i18n.t('Organisation units')}</span>
                    <span className={styles.value}>
                        {formatCount(
                            predictionSetup.configuredModelWithDataSource.orgUnits.length,
                            i18n.t('location'),
                            i18n.t('locations'),
                        )}
                    </span>
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>{i18n.t('Data sources')}</span>
                    <span className={styles.value}>
                        {formatCount(
                            predictionSetup.configuredModelWithDataSource.dataSources.length,
                            i18n.t('source'),
                            i18n.t('sources'),
                        )}
                    </span>
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>{i18n.t('Created')}</span>
                    <span className={styles.value}>{formatDate(predictionSetup.created)}</span>
                </div>
            </div>
        )}
    </Widget>
);
