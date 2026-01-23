import { Tooltip } from '@dhis2/ui';
import { StatusIndicator } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';
import { useJobs, JOB_STATUSES, JOB_TYPES } from '../../hooks/useJobs';

type JobTypeValue = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

type Props = {
    jobType: JobTypeValue;
};

export const RunningJobsIndicator = ({ jobType }: Props) => {
    const { jobs } = useJobs();

    const runningJobs = jobs?.filter(job =>
        job.type === jobType &&
        (job.status === JOB_STATUSES.PENDING || job.status === JOB_STATUSES.STARTED),
    ) || [];

    if (runningJobs.length === 0) {
        return null;
    }

    return (
        <Tooltip content={i18n.t('There are running jobs in the background')}>
            <StatusIndicator
                variant="info"
                active={true}
                label={i18n.t('Running jobs')}
            />
        </Tooltip>
    );
};
