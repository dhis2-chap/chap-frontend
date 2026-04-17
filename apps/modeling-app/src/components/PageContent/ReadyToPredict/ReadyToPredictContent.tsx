import { Card } from '@dhis2-chap/ui';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ReadyToPredictContent.module.css';
import { ReadyToPredictTable } from './ReadyToPredictTable';
import { useConfiguredModelsWithDataSource } from '../../../hooks/useConfiguredModelsWithDataSource';

export const ReadyToPredictContent: React.FC = () => {
    const { configuredModels, error, isLoading } = useConfiguredModelsWithDataSource();

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
                <NoticeBox error title={i18n.t('Error loading prediction configurations')}>
                    {error.message || i18n.t('An unknown error occurred')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <Card className={styles.container}>
            <ReadyToPredictTable configuredModels={configuredModels || []} />
        </Card>
    );
};
