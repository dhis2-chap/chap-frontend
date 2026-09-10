import { Card } from '@dhis2-chap/ui';
import { CircularLoader } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ModelContent.module.css';
import { ModelsTable } from './ModelsTable';
import { useModels } from '../../../hooks/useModels';
import { ChapErrorNotice } from '../../ChapErrorNotice';
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
                <ChapErrorNotice error={error} title={i18n.t('Error loading models')} />
            </div>
        );
    }

    return (
        <Card className={styles.container}>
            <ModelsTable models={models || []} />
        </Card>
    );
};
