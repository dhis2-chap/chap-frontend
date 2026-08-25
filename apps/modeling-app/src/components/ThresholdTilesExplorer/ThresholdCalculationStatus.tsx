import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import styles from './ThresholdCalculationStatus.module.css';

type Props = {
    isLoading: boolean;
    error: boolean;
};

export const ThresholdCalculationStatus = ({ isLoading, error }: Props) => {
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
                {i18n.t('There was a problem calculating thresholds for this prediction run.')}
            </NoticeBox>
        );
    }

    return null;
};
