import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button } from '@dhis2/ui';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';

export const NewModelPage: React.FC = () => {
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('New Model')}
                pageDescription={i18n.t('Configure and create a new predictive model for your analysis.')}
            />
            <div style={{ padding: '16px' }}>
                <Button primary>
                    {i18n.t('Create Model')}
                </Button>
            </div>
        </>
    );
};
