import React from 'react';
import { Card } from '@dhis2-chap/ui';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ModelContent.module.css';
import { ModelsTable } from './ModelsTable';
import { useModels } from '../../../hooks/useModels';

export const ModelContent: React.FC = () => {
    const { models, error, isLoading } = useModels();

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
