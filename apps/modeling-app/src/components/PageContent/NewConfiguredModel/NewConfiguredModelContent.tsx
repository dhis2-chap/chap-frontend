import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { NewModelForm } from './NewModelForm';
import { useModelTemplates } from '@/hooks/useModelTemplates';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import styles from './NewConfiguredModelContent.module.css';

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
                <NoticeBox error title={i18n.t('Error loading model templates')}>
                    {modelTemplatesError?.message || i18n.t('An unknown error occurred')}
                </NoticeBox>
            </div>
        );
    }

    if (!modelTemplates) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('No model templates found')}>
                    {i18n.t('No model templates found')}
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
