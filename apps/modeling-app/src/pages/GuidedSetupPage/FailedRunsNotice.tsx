import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, NoticeBox } from '@dhis2/ui';
import { ViewJobLogsModal } from '../../components/JobsTable/JobActionsMenu/ViewJobLogsModal/ViewJobLogsModal';
import { getJobModelName } from '../BenchmarksPage/benchmarkUtils';
import type { RunningBenchmarkJob } from '../BenchmarksPage/useRunningBenchmarkJobs';
import styles from './GuidedSetupPage.module.css';

/** Models whose evaluation failed, so a run that ends without results does not go unnoticed. */
export const FailedRunsNotice = ({ failedRuns }: { failedRuns: RunningBenchmarkJob[] }) => {
    const [logsJob, setLogsJob] = useState<RunningBenchmarkJob['job']>();
    if (!failedRuns.length) return null;

    return (
        <NoticeBox
            error
            title={i18n.t('{{count}} models failed', { count: failedRuns.length, defaultValue: '{{count}} model failed', defaultValue_plural: '{{count}} models failed' })}
            dataTest="guided-failed-runs"
        >
            <ul className={styles.failedRuns}>
                {failedRuns.map(({ job }) => (
                    <li key={job.id} className={styles.failedRun}>
                        <span>
                            <span className={styles.itemName}>{getJobModelName(job.name)}</span>
                            {job.error && <span className={styles.failedError}>{job.error.split('\n')[0]}</span>}
                        </span>
                        <Button small secondary onClick={() => setLogsJob(job)}>{i18n.t('View logs')}</Button>
                    </li>
                ))}
            </ul>
            {logsJob && <ViewJobLogsModal jobId={logsJob.id} status={logsJob.status} onClose={() => setLogsJob(undefined)} />}
        </NoticeBox>
    );
};
