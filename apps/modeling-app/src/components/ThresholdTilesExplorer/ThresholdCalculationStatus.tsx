import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox } from '@dhis2/ui';
import styles from './ThresholdCalculationStatus.module.css';

type Props = {
    isLoading: boolean;
    error: boolean;
    onRetry?: () => void;
};

export const ThresholdCalculationStatus = ({ isLoading, error, onRetry }: Props) => {
    if (isLoading) {
        return (
            <div className={styles.container}>
                <CircularLoader small />
                <span>{i18n.t('Calculating thresholds...')}</span>
            </div>
        );
    }

    if (error) {
        return (
            <NoticeBox error title={i18n.t('Unable to calculate thresholds')}>
                <div className={styles.errorContent}>
                    {i18n.t('There was a problem calculating thresholds for this prediction run.')}
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
