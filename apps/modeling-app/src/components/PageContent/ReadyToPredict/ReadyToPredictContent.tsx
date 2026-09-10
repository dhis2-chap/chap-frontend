import { Card } from '@dhis2-chap/ui';
import { CircularLoader } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ReadyToPredictContent.module.css';
import { ReadyToPredictTable } from './ReadyToPredictTable';
import { usePredictionSetups } from '../../../hooks/usePredictionSetups';
import { ChapErrorNotice } from '../../ChapErrorNotice';

export const ReadyToPredictContent: React.FC = () => {
    const { predictionSetups, error, isLoading } = usePredictionSetups();

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <ChapErrorNotice error={error} title={i18n.t('Error loading prediction configurations')} />
            </div>
        );
    }

    return (
        <Card className={styles.container}>
            <ReadyToPredictTable predictionSetups={predictionSetups || []} />
        </Card>
    );
};
