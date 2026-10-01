import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Widget } from '@dhis2-chap/ui';
import { useLocation, useParams } from 'react-router-dom';
import { JobLogs } from '../../JobsTable/JobActionsMenu/ViewJobLogsModal/JobLogs';
import { sortByCreatedDesc } from '../../../utils/sortByCreated';
import { JOB_STATUSES, JOB_TYPES, useJobs } from '../../../hooks/useJobs';
import { usePredictionSetup } from '../../../hooks/usePredictionSetup';
import { FEATURES, useExperimentalFeature } from '../../../features/settings/Experimental';
import { ActivityWidget } from './ActivityWidget';
import { PredictionRunsWidget } from './PredictionRunsWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { SchedulingWidget } from './SchedulingWidget';
import { SummaryWidget } from './SummaryWidget';
import styles from './ConfiguredModelDashboard.module.css';

export const ConfiguredModelDashboard: React.FC = () => {
    const { predictionSetupId } = useParams();
    const { state } = useLocation();
    const [logsOpen, setLogsOpen] = useState(true);
    const parsedPredictionSetupId = Number(predictionSetupId);
    const {
        predictionSetup,
        error,
        hasValidPredictionSetupId,
        isLoading,
    } = usePredictionSetup(predictionSetupId);
    const { enabled: isSchedulingEnabled } = useExperimentalFeature(FEATURES.SCHEDULING);
    const {
        jobs = [],
        error: jobsError,
        isLoading: isLoadingJobs,
    } = useJobs({
        predictionSetupId: parsedPredictionSetupId,
        enabled: hasValidPredictionSetupId,
    });

    // Prefer the submitted job; keep the latest job visible on direct visits too,
    // including after failure, when no completed prediction has been created.
    const predictionJob = useMemo(() => {
        const predictionJobs = jobs
            .filter(job => job.type === JOB_TYPES.MAKE_PREDICTION)
            .sort((a, b) => (b.start_time ?? '').localeCompare(a.start_time ?? ''));
        return predictionJobs.find(job => job.id === state?.predictionJobId)
            ?? predictionJobs.find(job => (
                job.status === JOB_STATUSES.PENDING || job.status === JOB_STATUSES.STARTED
            ))
            ?? predictionJobs[0];
    }, [jobs, state?.predictionJobId]);

    const predictions = useMemo(() => (
        hasValidPredictionSetupId
            ? sortByCreatedDesc(predictionSetup?.predictions ?? [])
            : []
    ), [predictionSetup?.predictions, hasValidPredictionSetupId]);
    const hasRunningJob = useMemo(() => jobs.some(job => (
        job.status === JOB_STATUSES.PENDING
        || job.status === JOB_STATUSES.STARTED
    )), [jobs]);

    return (
        <div className={styles.container}>
            <div className={styles.leftColumn}>
                {predictionJob && (
                    <Widget
                        header={i18n.t('Prediction job logs')}
                        open={logsOpen}
                        onOpen={() => setLogsOpen(true)}
                        onClose={() => setLogsOpen(false)}
                    >
                        <div className={styles.jobLogs}>
                            <div>{predictionJob.name || predictionJob.id}</div>
                            <JobLogs
                                key={predictionJob.id}
                                jobId={predictionJob.id}
                                status={predictionJob.status}
                            />
                        </div>
                    </Widget>
                )}
                <PredictionRunsWidget
                    predictionSetupId={predictionSetupId}
                    error={error}
                    hasValidPredictionSetupId={hasValidPredictionSetupId}
                    hasRunningJob={hasRunningJob}
                    isLoading={isLoading}
                    predictions={predictions}
                />
                <ActivityWidget
                    error={jobsError}
                    hasValidPredictionSetupId={hasValidPredictionSetupId}
                    isLoading={isLoadingJobs}
                    jobs={jobs}
                    predictionSetupId={predictionSetupId}
                />
            </div>
            <div className={styles.rightColumn}>
                <QuickActionsWidget
                    predictionSetupId={predictionSetupId}
                    predictionSetup={predictionSetup}
                    isLoading={isLoading}
                    latestPredictionId={predictions[0]?.id}
                />
                {isSchedulingEnabled && (
                    <SchedulingWidget
                        predictionSetup={predictionSetup}
                        isLoading={isLoading}
                    />
                )}
                <SummaryWidget
                    predictionSetup={predictionSetup}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};
