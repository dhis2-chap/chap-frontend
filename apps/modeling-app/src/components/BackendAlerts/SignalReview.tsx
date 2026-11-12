import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { useAlert } from '@dhis2/app-runtime';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { convertServerToClientPeriod, PERIOD_TYPES } from '@dhis2-chap/core';
import { SignalReviewTable, type AlertPolicyRead, type ModelSpecRead, type PredictionInfo } from '@dhis2-chap/ui';
import { ThresholdCalculationStatus } from '@/components/ThresholdTilesExplorer';
import { usePredictionSeries } from '@/components/PageContent/PredictionDetails/hooks/usePredictionSeries';
import { useAlertPolicyThresholds } from '@/hooks/useAlertPolicyThresholds';
import { usePredictionAlerts } from '@/hooks/usePredictionAlerts';
import { useReviewAlerts } from '@/hooks/useReviewAlerts';
import { AlertLevelTag } from './AlertLevelTag';
import type { DisplayedPredictionAlert } from './displayPredictionAlerts';
import { SignalEvidence } from './SignalEvidence';
import { SignalTrackRecord } from './SignalTrackRecord';
import styles from './BackendAlerts.module.css';

const NO_POLICIES: AlertPolicyRead[] = [];
const getSeverity = (alert: DisplayedPredictionAlert) => alert.severity;

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

export const SignalReview = ({ prediction, model }: Props) => {
    const { series, predictionTargetName, isLoading: isSeriesLoading, error: seriesError } = usePredictionSeries({ prediction, model });
    const alerts = usePredictionAlerts(prediction, true);
    const thresholds = useAlertPolicyThresholds({
        datasetId: prediction.datasetId,
        series,
        policies: alerts.status.kind === 'policy' ? alerts.status.policies : NO_POLICIES,
        enabled: true,
    });
    const review = useReviewAlerts();
    const { show: showSaved } = useAlert(i18n.t('Signal review saved'), { success: true });
    const orgUnitNames = useMemo(() => new Map(series.map(item => [item.orgUnitId, item.orgUnitName])), [series]);

    if (alerts.isLoading || isSeriesLoading) {
        return <CircularLoader />;
    }
    // A failed refresh after a save keeps the signals that are already loaded.
    if ((alerts.error && !alerts.data) || seriesError) {
        return <NoticeBox error title={i18n.t('Unable to load raised signals')} />;
    }
    if (alerts.displayedAlerts.length === 0) {
        return <NoticeBox>{i18n.t('No signals were recorded for this run.')}</NoticeBox>;
    }

    return (
        <div className={styles.form}>
            {review.userError && (
                <NoticeBox error>{i18n.t('Unable to load the signed-in user. Reload the page to retry.')}</NoticeBox>
            )}
            {review.isError && (
                <NoticeBox error>{i18n.t('Unable to save the review. Please try again.')}</NoticeBox>
            )}
            <ThresholdCalculationStatus
                isLoading={thresholds.isLoading}
                isPaused={thresholds.isPaused}
                error={thresholds.error}
                onRetry={thresholds.refetch}
                hint={i18n.t('Edit the signal policy to change its thresholds.')}
            />
            {/* Runs made before Chap recorded their policy can hold signals from more than one. */}
            {[...new Set(alerts.displayedAlerts.map(alert => alert.alertPolicyId))].map(policyId => (
                <SignalTrackRecord key={policyId} policyId={policyId} predictionSetupId={prediction.predictionSetupId} />
            ))}
            <SignalReviewTable
                alerts={alerts.displayedAlerts}
                // Levels cannot be ranked when their policies failed to load.
                getSeverity={alerts.displayError ? undefined : getSeverity}
                orgUnitNames={orgUnitNames}
                formatPeriod={period => convertServerToClientPeriod(period, prediction.dataset.periodType as keyof typeof PERIOD_TYPES)}
                disabled={!review.isUserLoaded}
                saving={review.isLoading ? review.variables : undefined}
                onReview={decision => review.mutate(decision, { onSuccess: () => showSaved() })}
                renderLevel={alert => <AlertLevelTag display={alert.display} />}
                renderDetails={orgUnitAlerts => (
                    <SignalEvidence
                        alerts={orgUnitAlerts}
                        predictionTargetName={predictionTargetName}
                        series={series.find(item => item.orgUnitId === orgUnitAlerts[0].orgUnit)}
                        thresholdLines={thresholds.linesByOrgUnit.get(orgUnitAlerts[0].orgUnit)}
                    />
                )}
            />
        </div>
    );
};
