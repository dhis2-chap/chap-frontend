import i18n from '@dhis2/d2-i18n';
import { Card } from '@dhis2-chap/ui';
import { useJobs } from '../../../hooks/useJobs';
import { CircularLoader } from '@dhis2/ui';
import styles from './JobsContent.module.css';
import { JobsTable } from '../../JobsTable';
import type { JobsTableFilterKey } from '../../JobsTable/JobsTableFilters';
import { ChapErrorNotice } from '../../ChapErrorNotice';

type Props = {
    predictionSetupId?: number;
    visibleFilters?: JobsTableFilterKey[];
};

export const JobsContent = ({ predictionSetupId, visibleFilters }: Props = {}) => {
    const { jobs, error, isLoading } = useJobs({ predictionSetupId });

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
                <ChapErrorNotice error={error} title={i18n.t('Error loading jobs')} />
            </div>
        );
    }

    return (
        <div>
            <Card className={styles.container}>
                <JobsTable jobs={jobs || []} visibleFilters={visibleFilters} />
            </Card>
        </div>
    );
};
