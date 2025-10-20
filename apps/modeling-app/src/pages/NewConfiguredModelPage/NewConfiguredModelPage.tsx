import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { NewConfiguredModelContent } from '../../components/PageContent/NewConfiguredModel';

export const NewConfiguredModelPage: React.FC = () => {
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('New configured model')}
                pageDescription={i18n.t('Configure and save a new model for reuse.')}
            />
            <NewConfiguredModelContent />
        </>
    );
};


