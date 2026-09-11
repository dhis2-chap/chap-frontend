import i18n from '@dhis2/d2-i18n';
import { NewModelForm } from './NewModelForm';
import { useModelTemplates } from '@/hooks/useModelTemplates';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import styles from './NewConfiguredModelContent.module.css';
import { ChapErrorNotice } from '../../ChapErrorNotice';

export const NewConfiguredModelContent: React.FC = () => {
    const {
        modelTemplates,
        isLoading: isModelTemplatesLoading,
        error: modelTemplatesError,
    } = useModelTemplates();

    if (isModelTemplatesLoading) {
        return (
            <div className={styles.loaderContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (modelTemplatesError) {
        return (
            <div className={styles.errorContainer}>
                <ChapErrorNotice error={modelTemplatesError} title={i18n.t('Error loading model templates')} />
            </div>
        );
    }

    if (!modelTemplates || modelTemplates.length === 0) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox warning title={i18n.t('No model templates found')}>
                    {i18n.t('We could not find any available model templates. Please create templates or try again later.')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <NewModelForm
            modelTemplates={modelTemplates}
        />
    );
};
