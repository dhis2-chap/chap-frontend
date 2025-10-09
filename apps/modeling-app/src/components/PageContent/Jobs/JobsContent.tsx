import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { NoticeBox } from '@dhis2/ui';
import { Card } from '@dhis2-chap/ui';
import { useJobs } from '../../../hooks/useJobs';
import { CircularLoader } from '@dhis2/ui';
import styles from './JobsContent.module.css';
import { JobsTable } from '../../JobsTable';

export const JobsContent = () => {
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
        <div>
            <Card className={styles.container}>
                <JobsTable jobs={jobs || []} />
            </Card>
        </div>
    );
};
