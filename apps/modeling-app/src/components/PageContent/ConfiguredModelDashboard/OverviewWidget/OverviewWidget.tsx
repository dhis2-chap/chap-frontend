import i18n from '@dhis2/d2-i18n';
import { CircularLoader } from '@dhis2/ui';
import type { PredictionInfo } from '@dhis2-chap/ui';
import { Widget } from '@dhis2-chap/ui';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import styles from './OverviewWidget.module.css';

const EMPTY_VALUE = '—';

const formatDate = (created?: string | null) => (
    created ? format(new Date(created), 'dd.MM.yyyy, HH:mm') : EMPTY_VALUE
);

type Props = {
    configuredId?: string;
    hasValidConfiguredId: boolean;
    isLoading: boolean;
    predictions: PredictionInfo[];
};

export const OverviewWidget = ({
    configuredId,
    hasValidConfiguredId,
    isLoading,
    predictions,
}: Props) => {
    const latestPrediction = predictions[0];
    const lastImportedPrediction = latestPrediction;
    const lastImportedAt = lastImportedPrediction?.created;
    const lastImportedRunPath = configuredId && lastImportedPrediction
        ? `/predictions/${configuredId}/runs/${lastImportedPrediction.id}`
        : undefined;

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
                            <span className={styles.value}>{i18n.t('Not scheduled')}</span>
                        </div>
                        <div className={styles.item}>
                            <span className={styles.label}>{i18n.t('Last run')}</span>
                            <span className={styles.value}>
                                {latestPrediction
                                    ? formatDate(latestPrediction.created)
                                    : i18n.t('No runs yet')}
                            </span>
                        </div>
                        <div className={styles.item}>
                            <span className={styles.label}>{i18n.t('Last imported at')}</span>
                            <span className={styles.value}>
                                {lastImportedRunPath && lastImportedAt
                                    ? (
                                            <>
                                                {formatDate(lastImportedAt)}
                                                {' ('}
                                                <Link
                                                    className={styles.link}
                                                    to={lastImportedRunPath}
                                                >
                                                    {`#${lastImportedPrediction.id}`}
                                                </Link>
                                                )
                                            </>
                                        )
                                    : i18n.t('Not imported')}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </Widget>
    );
};
