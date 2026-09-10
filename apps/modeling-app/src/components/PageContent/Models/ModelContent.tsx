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
        const isUnauthorized = error.status === 401;
        return (
            <div className={styles.errorContainer}>
                <NoticeBox
                    error
                    title={isUnauthorized
                        ? i18n.t('Not authorized to access the CHAP server')
                        : i18n.t('Error loading models')}
                >
                    {isUnauthorized
                        ? i18n.t('The CHAP server refused the request. An administrator can check the API token under Settings, in the route configuration.')
                        : error.message || i18n.t('An unknown error occurred')}
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
