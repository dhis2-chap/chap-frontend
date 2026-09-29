import i18n from '@dhis2/d2-i18n';
import { StatusIndicator } from '@dhis2-chap/ui';
import { JOB_STATUSES, useJobs } from '../../hooks/useJobs';

/** Only counts runs queued from this page: jobs do not say which benchmark they belong to. */
export const BenchmarkRunsIndicator = ({ jobIds }: { jobIds: string[] }) => {
    const { jobs } = useJobs();
    const count = jobs?.filter(job => jobIds.includes(job.id) &&
        (job.status === JOB_STATUSES.PENDING || job.status === JOB_STATUSES.STARTED)).length ?? 0;

    if (!count) return null;
    return (
        <StatusIndicator
            variant="info"
            active
            label={i18n.t('{{count}} model runs in progress', { count, defaultValue: '{{count}} model run in progress', defaultValue_plural: '{{count}} model runs in progress' })}
        />
    );
};
