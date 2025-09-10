import React from 'react';
import { Card } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ModelsPage.module.css';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';

export const ModelsPage: React.FC = () => {
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Models')}
                pageDescription={i18n.t('Manage templates and configured models available in your system.')}
            />
            <Card className={styles.container}>
                <div className={styles.content}>
                    <p>{i18n.t('Model templates and configured models will be displayed here.')}</p>
                </div>
            </Card>
        </>
    );
};
