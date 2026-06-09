import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { sortByCreatedDesc } from '../../../utils/sortByCreated';
import { JOB_STATUSES, useJobs } from '../../../hooks/useJobs';
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
