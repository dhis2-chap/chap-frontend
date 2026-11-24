import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { sortByCreatedDesc } from '../../../utils/sortByCreated';
import { JOB_STATUSES, useJobs } from '../../../hooks/useJobs';
import { usePredictionSetup } from '../../../hooks/usePredictionSetup';
import { Features, useIsFeatureAvailable } from '../../../hooks/useIsFeatureAvailable';
import { FEATURES, useExperimentalFeature } from '../../../features/settings/Experimental';
import { ActivityWidget } from './ActivityWidget';
import { PredictionRunsWidget } from './PredictionRunsWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { SchedulingWidget } from './SchedulingWidget';
import { MonitoringWidget } from './MonitoringWidget/MonitoringWidget';
import { SummaryWidget } from './SummaryWidget';
import { InputDataCheckWidget } from './InputDataCheckWidget';
import styles from './ConfiguredModelDashboard.module.css';

type Props = {
    /** Defaults to the prediction setup in the URL. */
    predictionSetupId?: string;
    /** Where to come back to after starting a prediction. Defaults to the prediction setup page. */
    returnTo?: string;
    /** Only the runs, the monitoring, the actions and the configuration; leaves out activity, input checks and scheduling. */
    essentialsOnly?: boolean;
};

export const ConfiguredModelDashboard = ({ predictionSetupId: givenPredictionSetupId, returnTo, essentialsOnly = false }: Props) => {
    const params = useParams();
    const predictionSetupId = givenPredictionSetupId ?? params.predictionSetupId;
    const parsedPredictionSetupId = Number(predictionSetupId);
    const {
        predictionSetup,
        error,
        hasValidPredictionSetupId,
        isLoading,
    } = usePredictionSetup(predictionSetupId);
    const { enabled: isSchedulingEnabled } = useExperimentalFeature(FEATURES.SCHEDULING);
    const { isAvailable: isMonitoringAvailable } = useIsFeatureAvailable(Features.PREDICTION_MONITORING);
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
                    jobs={jobs}
                    predictions={predictions}
                />
                {predictionSetup && isMonitoringAvailable && (
                    <MonitoringWidget
                        key={predictionSetup.id}
                        predictionSetupId={predictionSetup.id}
                        evaluationId={predictionSetup.backtestId}
                    />
                )}
                {!essentialsOnly && (
                    <ActivityWidget
                        error={jobsError}
                        hasValidPredictionSetupId={hasValidPredictionSetupId}
                        isLoading={isLoadingJobs}
                        jobs={jobs}
                        predictionSetupId={predictionSetupId}
                    />
                )}
            </div>
            <div className={styles.rightColumn}>
                <QuickActionsWidget
                    predictionSetupId={predictionSetupId}
                    predictionSetup={predictionSetup}
                    isLoading={isLoading}
                    latestPredictionId={predictions[0]?.id}
                    returnTo={returnTo}
                />
                {!essentialsOnly && (
                    <InputDataCheckWidget
                        predictionSetup={predictionSetup}
                        latestDatasetId={predictions[0]?.datasetId}
                    />
                )}
                {isSchedulingEnabled && !essentialsOnly && (
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
