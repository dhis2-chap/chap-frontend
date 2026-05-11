import { useMemo } from 'react';
import type { PredictionInfo } from '@dhis2-chap/ui';
import { useParams } from 'react-router-dom';
import { JOB_STATUSES, useJobs } from '../../../hooks/useJobs';
import { usePredictionSetup } from '../../../hooks/usePredictionSetup';
import { ActivityWidget } from './ActivityWidget';
import { MonitoringWidget } from './MonitoringWidget';
import { OverviewWidget } from './OverviewWidget';
import { PredictionRunsWidget } from './PredictionRunsWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { SummaryWidget } from './SummaryWidget';
import styles from './ConfiguredModelDashboard.module.css';

const getCreatedTime = (created?: string | null) => {
    if (!created) {
        return 0;
    }

    const time = Date.parse(created);
    return Number.isNaN(time) ? 0 : time;
};

const getLatestPredictions = (predictions?: PredictionInfo[]) => (
    [...(predictions || [])]
        .sort((first, second) => getCreatedTime(second.created) - getCreatedTime(first.created))
);

export const ConfiguredModelDashboard: React.FC = () => {
    const { configuredId } = useParams();
    const parsedConfiguredId = Number(configuredId);
    const {
        predictionSetup,
        error,
        hasValidPredictionSetupId,
        isLoading,
    } = usePredictionSetup(configuredId);
    const {
        jobs = [],
        error: jobsError,
        isLoading: isLoadingJobs,
    } = useJobs({
        predictionSetupId: parsedConfiguredId,
        enabled: hasValidPredictionSetupId,
    });

    const predictions = useMemo(() => (
        hasValidPredictionSetupId
            ? getLatestPredictions(predictionSetup?.predictions)
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
                    configuredId={configuredId}
                    error={error}
                    hasValidConfiguredId={hasValidPredictionSetupId}
                    hasRunningJob={hasRunningJob}
                    isLoading={isLoading}
                    predictions={predictions}
                />
                <MonitoringWidget />
                <ActivityWidget
                    error={jobsError}
                    hasValidConfiguredId={hasValidPredictionSetupId}
                    isLoading={isLoadingJobs}
                    jobs={jobs}
                />
            </div>
            <div className={styles.rightColumn}>
                <QuickActionsWidget
                    configuredId={configuredId}
                    predictionSetup={predictionSetup}
                    isLoading={isLoading}
                    latestPredictionId={predictions[0]?.id}
                />
                <OverviewWidget
                    hasValidConfiguredId={hasValidPredictionSetupId}
                    isLoading={isLoading}
                    predictions={predictions}
                />
                <SummaryWidget
                    predictionSetup={predictionSetup}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};
