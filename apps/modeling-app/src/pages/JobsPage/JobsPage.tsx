import React from 'react';
import {
    CircularLoader,
    NoticeBox,
} from '@dhis2/ui';
import { Card } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './JobsPage.module.css';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { useJobs } from '../../hooks/useJobs';
import { JobsTable } from '../../components/JobsTable';

export const JobsPage: React.FC = () => {
    const { jobs, error, isLoading } = useJobs();

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
                <NoticeBox error title={i18n.t('Error loading jobs')}>
                    {error.message || i18n.t('An unknown error occurred')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Active jobs')}
                pageDescription={i18n.t('View and manage currently running jobs and their status.')}
            />
            <Card className={styles.container}>
                <JobsTable jobs={jobs || []} />
            </Card>
        </>
    );
};
