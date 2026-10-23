import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import type { ApiError } from '@dhis2-chap/ui';
import { getThresholdCalculationErrorDetail } from '@/utils/thresholdCalculationError';
import { ErrorNoticeWithRetry } from './ErrorNoticeWithRetry';
import styles from './ThresholdCalculationStatus.module.css';

type Props = {
    isLoading: boolean;
    isPaused?: boolean;
    error?: ApiError | null;
    onRetry?: () => void;
    hint?: string;
};

export const ThresholdCalculationStatus = ({
    isLoading,
    isPaused,
    error,
    onRetry,
    hint = i18n.t('Review the threshold parameters and apply your changes.'),
}: Props) => {
    if (isPaused) {
        return (
            <NoticeBox warning title={i18n.t('Waiting for connection')}>
                {i18n.t('Threshold calculation will resume when your connection returns.')}
            </NoticeBox>
        );
    }
    if (isLoading) {
        return (
            <div className={styles.container}>
                <CircularLoader small />
                <span>{i18n.t('Calculating thresholds...')}</span>
            </div>
        );
    }

    if (error) {
        const detail = getThresholdCalculationErrorDetail(error);
        return (
            <ErrorNoticeWithRetry title={i18n.t('Unable to calculate thresholds')} onRetry={onRetry}>
                <div>{detail ?? i18n.t('There was a problem calculating thresholds for this prediction run.')}</div>
                {(error.status === 400 || error.status === 422) && (
                    <div>{hint}</div>
                )}
            </ErrorNoticeWithRetry>
        );
    }

    return null;
};
