import { Card } from '@dhis2-chap/ui';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ModelTemplatesContent.module.css';
import { ModelTemplatesTable } from '../ModelTemplatesTable';
import { useModelTemplates } from '../../../../hooks/useModelTemplates';

export const ModelTemplatesContent: React.FC = () => {
    const { modelTemplates, error, isLoading } = useModelTemplates();

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
                <NoticeBox error title={i18n.t('Error loading model templates')}>
                    {error?.message || i18n.t('An unknown error occurred')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <Card className={styles.container}>
            <ModelTemplatesTable templates={modelTemplates || []} />
        </Card>
    );
};
