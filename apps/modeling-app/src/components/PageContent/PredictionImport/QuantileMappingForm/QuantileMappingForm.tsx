import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    NoticeBox,
} from '@dhis2/ui';
import { useAlertPolicies } from '@/hooks/useAlertPolicies';
import { useAuthority } from '@/hooks/useAuthority';
import { Features, useIsFeatureAvailable } from '@/hooks/useIsFeatureAvailable';
import { usePredictionSetup } from '@/hooks/usePredictionSetup';
import { usePredictionSeries } from '../../PredictionDetails/hooks/usePredictionSeries';
import { QuantileMappingFormContent } from './QuantileMappingFormContent';
import type { QuantileMappingFormProps } from './quantileMappingFormTypes';
import styles from './QuantileMappingForm.module.css';

export const QuantileMappingForm = ({
    prediction,
    model,
    predictionSetupId,
}: QuantileMappingFormProps) => {
    const {
        series,
        isLoading: isSeriesLoading,
        error: seriesError,
    } = usePredictionSeries({ prediction, model });
    const {
        predictionSetup,
        isLoading: isPredictionSetupLoading,
        error: predictionSetupError,
    } = usePredictionSetup(predictionSetupId);
    const {
        hasAuthority: canDeleteDataValues,
        isLoading: isDeleteAuthorityLoading,
    } = useAuthority({ authority: 'F_DATAVALUE_DELETE' });

    const {
        isAvailable: isPolicyRecorded,
        isLoading: isVersionLoading,
    } = useIsFeatureAvailable(Features.PREDICTION_ALERT_POLICY);
    const policies = useAlertPolicies();
    const hasRecordedPolicy = isPolicyRecorded && prediction.alertPolicyId != null;
    // Chap records the policy a run used from 2.6.0; older versions only know the setup's current policy.
    const policy = isPolicyRecorded
        ? policies.data?.find(({ id }) => id === prediction.alertPolicyId) ?? null
        : predictionSetup?.alertPolicy;

    const isPredictionSetupMissing = !predictionSetup;
    const isLoading = isSeriesLoading
        || isVersionLoading
        || (hasRecordedPolicy && policies.isLoading)
        || (isPredictionSetupMissing && isPredictionSetupLoading);
    const error = seriesError
        || (hasRecordedPolicy ? policies.error : null)
        || (isPredictionSetupMissing ? predictionSetupError : null);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (error || !predictionSetup) {
        return (
            <NoticeBox error title={i18n.t('Unable to load alert data')}>
                {i18n.t('There was a problem loading the prediction data required for outbreak indicator import.')}
            </NoticeBox>
        );
    }

    return (
        <QuantileMappingFormContent
            prediction={prediction}
            model={model}
            predictionSetupId={predictionSetupId}
            predictionSetup={predictionSetup}
            policy={policy}
            series={series}
            canDeleteDataValues={canDeleteDataValues}
            isDeleteAuthorityLoading={isDeleteAuthorityLoading}
        />
    );
};
