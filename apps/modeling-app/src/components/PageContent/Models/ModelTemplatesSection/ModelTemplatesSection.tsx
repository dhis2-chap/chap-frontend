import React from 'react';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Card } from '@dhis2-chap/ui';
import { useModelTemplates } from '../../../../hooks/useModelTemplates';
import { useAvailableModelTemplates } from '../../../../hooks/useAvailableModelTemplates';
import { ModelTemplatesTable } from './ModelTemplatesTable';
import { AddModelTemplateForm } from './AddModelTemplateForm';
import styles from './ModelTemplatesSection.module.css';

export const ModelTemplatesSection = () => {
    const {
        modelTemplates,
        error: templatesError,
        isLoading: templatesLoading,
    } = useModelTemplates();

    const {
        availableTemplates,
        error: availableError,
        isLoading: availableLoading,
    } = useAvailableModelTemplates();

    if (templatesLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{i18n.t('Model Templates')}</h3>
                </div>
                <Card>
                    <div className={styles.loadingContainer}>
                        <CircularLoader />
                    </div>
                </Card>
            </div>
        );
    }

    if (templatesError) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{i18n.t('Model Templates')}</h3>
                </div>
                <div className={styles.errorContainer}>
                    <NoticeBox error title={i18n.t('Error loading model templates')}>
                        {templatesError.message || i18n.t('An unknown error occurred')}
                    </NoticeBox>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>{i18n.t('Model Templates')}</h3>
                <p className={styles.description}>
                    {i18n.t('Manage model templates. A model template can be used to make configured models. The table below shows all model templates that can be used. It is also possible to add model templates to the system by selecting a url and version from the select box.')}
                </p>
            </div>

            <AddModelTemplateForm
                availableTemplates={availableTemplates || []}
                isLoading={availableLoading}
            />

            {availableError && (
                <div className={styles.errorContainer}>
                    <NoticeBox warning title={i18n.t('Could not load available templates')}>
                        {i18n.t('Unable to fetch the list of available templates to add.')}
                    </NoticeBox>
                </div>
            )}

            <Card>
                <ModelTemplatesTable modelTemplates={modelTemplates || []} />
            </Card>
        </div>
    );
};
