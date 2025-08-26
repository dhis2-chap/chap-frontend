import React from 'react';
import { Tooltip } from '@dhis2/ui';
import { StatusIndicator } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';
import { useJobs, JOB_STATUSES, JOB_TYPES } from '../../../hooks/useJobs';

export const RunningJobsIndicator = () => {
    const { jobs } = useJobs();

    const runningBacktestJobs = jobs?.filter(job =>
        job.type === JOB_TYPES.CREATE_BACKTEST_WITH_DATA &&
        (job.status === JOB_STATUSES.PENDING || job.status === JOB_STATUSES.STARTED)
    ) || [];

    if (runningBacktestJobs.length === 0) {
        return null;
    }

    return (
        <Tooltip content={i18n.t('There are running jobs in the background')}>
            <StatusIndicator
                variant='info'
                active={true}
                label={i18n.t('Running jobs')}
            />
        </Tooltip>
    );
}; 