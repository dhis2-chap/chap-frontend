import { Card } from '@dhis2-chap/ui';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ModelContent.module.css';
import { ModelsTable } from './ModelsTable';
import { useModels } from '../../../hooks/useModels';
import { useModelsTableFilters } from './ModelsTable/hooks/useModelsTableFilters';

export const ModelContent: React.FC = () => {
    const { includeArchived } = useModelsTableFilters();
    const { models, error, isLoading } = useModels({ includeArchived });

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
                <NoticeBox error title={i18n.t('Error loading models')}>
                    {error.message || i18n.t('An unknown error occurred')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <Card className={styles.container}>
            <ModelsTable models={models || []} />
        </Card>
    );
};
