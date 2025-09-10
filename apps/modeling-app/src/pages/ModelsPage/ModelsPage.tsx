import React from 'react';
import { Card } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ModelsPage.module.css';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { useAvailableModels } from '../../hooks/useAvailableModels';
import { ModelsTable } from '../../components/ModelsTable';

export const ModelsPage: React.FC = () => {
    const { models, error, isLoading } = useAvailableModels();

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
        <>
            <PageHeader
                pageTitle={i18n.t('Models')}
                pageDescription={i18n.t('Manage templates and configured models available in your system.')}
            />
            <Card className={styles.container}>
                <ModelsTable models={models || []} />
            </Card>
        </>
    );
};
