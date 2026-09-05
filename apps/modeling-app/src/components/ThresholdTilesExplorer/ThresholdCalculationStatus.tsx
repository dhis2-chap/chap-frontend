import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox } from '@dhis2/ui';
import type { ApiError } from '@dhis2-chap/ui';
import { getThresholdCalculationErrorDetail } from '@/utils/thresholdCalculationError';
import styles from './ThresholdCalculationStatus.module.css';

type Props = {
    isLoading: boolean;
    isPaused?: boolean;
    error?: ApiError | null;
    onRetry?: () => void;
};

export const ThresholdCalculationStatus = ({ isLoading, isPaused, error, onRetry }: Props) => {
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
            <NoticeBox error title={i18n.t('Unable to calculate thresholds')}>
                <div className={styles.errorContent}>
                    <div>{detail ?? i18n.t('There was a problem calculating thresholds for this prediction run.')}</div>
                    {(error.status === 400 || error.status === 422) && (
                        <div>{i18n.t('Review the threshold parameters and apply your changes.')}</div>
                    )}
                    {onRetry && (
                        <Button small onClick={onRetry}>
                            {i18n.t('Retry')}
                        </Button>
                    )}
                </div>
            </NoticeBox>
        );
    }

    return null;
};
