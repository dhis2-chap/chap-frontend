import i18n from '@dhis2/d2-i18n';
import { CircularLoader } from '@dhis2/ui';
import type { PredictionInfo } from '@dhis2-chap/ui';
import { Widget } from '@dhis2-chap/ui';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './PredictionHistoryWidget.module.css';

const EMPTY_VALUE = '—';

const formatDate = (created?: string | null) => (
    created ? format(new Date(created), 'dd.MM.yyyy, HH:mm') : EMPTY_VALUE
);

type Props = {
    error?: unknown;
    hasValidConfiguredId: boolean;
    isLoading: boolean;
    predictions: PredictionInfo[];
    selectedPredictionId?: number;
    onSelectPrediction: (predictionId: number) => void;
};

export const PredictionHistoryWidget = ({
    error,
    hasValidConfiguredId,
    isLoading,
    predictions,
    selectedPredictionId,
    onSelectPrediction,
}: Props) => {
    const hasError = !!error;
    const hasRuns = predictions.length > 0;

    return (
        <Widget
            header={i18n.t('Runs')}
            noncollapsible
        >
            <div className={styles.content}>
                {isLoading && (
                    <div className={styles.loadingState}>
                        <CircularLoader small />
                    </div>
                )}
                {hasError && !isLoading && (
                    <div className={styles.errorState}>
                        {i18n.t('Error loading prediction history')}
                    </div>
                )}
                {!isLoading && !hasError && !hasValidConfiguredId && (
                    <div className={styles.emptyState}>
                        {i18n.t('Invalid prediction configuration')}
                    </div>
                )}
                {!isLoading && !hasError && hasValidConfiguredId && predictions.length === 0 && (
                    <div className={styles.emptyState}>
                        {i18n.t('No predictions have been run for this configuration yet')}
                    </div>
                )}
                {!isLoading && !hasError && hasRuns && (
                    <div
                        className={styles.list}
                        role="radiogroup"
                        aria-label={i18n.t('Runs')}
                    >
                        {predictions.map(prediction => (
                            <label
                                className={[
                                    styles.listItem,
                                    selectedPredictionId === prediction.id ? styles.selectedListItem : '',
                                ].join(' ')}
                                key={prediction.id}
                            >
                                <input
                                    className={styles.radio}
                                    type="radio"
                                    name="prediction-history"
                                    checked={selectedPredictionId === prediction.id}
                                    onChange={() => onSelectPrediction(prediction.id)}
                                />
                                <span className={styles.itemContent}>
                                    <span className={styles.itemTitle}>
                                        {prediction.name || i18n.t('Unnamed prediction')}
                                    </span>
                                    <span className={styles.itemMeta}>
                                        <span>{formatDate(prediction.created)}</span>
                                    </span>
                                </span>
                            </label>
                        ))}
                    </div>
                )}
                {hasRuns ? (
                    <Link className={styles.footerLink} to="/predictions">
                        {i18n.t('See all prediction runs')}
                    </Link>
                ) : (
                    <span
                        aria-disabled="true"
                        className={`${styles.footerLink} ${styles.disabledFooterLink}`}
                    >
                        {i18n.t('See all prediction runs')}
                    </span>
                )}
            </div>
        </Widget>
    );
};
