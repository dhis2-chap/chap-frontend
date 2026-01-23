import { Card } from '@dhis2-chap/ui';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ConfiguredModelsContent.module.css';
import { ConfiguredModelsTable } from './ConfiguredModelsTable';
import { useConfiguredModels } from '../../../hooks/useConfiguredModels';
import { useConfiguredModelsTableFilters } from './ConfiguredModelsTable/hooks/useConfiguredModelsTableFilters';

export const ConfiguredModelsContent: React.FC = () => {
    const { includeArchived } = useConfiguredModelsTableFilters();
    const { models, error, isLoading } = useConfiguredModels({ includeArchived });

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
                <NoticeBox error title={i18n.t('Error loading configured models')}>
                    {error.message || i18n.t('An unknown error occurred')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <Card className={styles.container}>
            <ConfiguredModelsTable models={models || []} />
        </Card>
    );
};
