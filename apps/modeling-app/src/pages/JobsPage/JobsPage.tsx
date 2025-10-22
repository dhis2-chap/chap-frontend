import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { JobsContent } from '../../components/PageContent/Jobs';

export const JobsPage: React.FC = () => {
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Active jobs')}
                pageDescription={i18n.t('View and manage currently running jobs and their status.')}
            />
            <JobsContent />
        </>
    );
};
