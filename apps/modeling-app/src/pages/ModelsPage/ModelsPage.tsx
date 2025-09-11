import React from 'react';
import i18n from '@dhis2/d2-i18n';
import styles from './ModelsPage.module.css';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { ModelTemplatesContent } from '../../components/ModelTemplatesContent';

export const ModelsPage: React.FC = () => {
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Models')}
                pageDescription={i18n.t('Manage templates and configured models available in your system.')}
            />
            <ModelTemplatesContent />
        </>
    );
};
