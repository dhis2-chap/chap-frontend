import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { ModelContent } from '../../components/PageContent/Models';

export const ModelsPage: React.FC = () => {
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Models')}
                pageDescription={i18n.t('Manage templates and configured models available in your system.')}
            />
            <ModelContent />
        </>
    );
};
