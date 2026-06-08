import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    NoticeBox,
} from '@dhis2/ui';
import type { PredictionOrgUnitSeries } from '@dhis2-chap/ui';
import { useAuthority } from '@/hooks/useAuthority';
import { useEndemicThresholds } from '@/hooks/useEndemicThresholds';
import { usePredictionSetup } from '@/hooks/usePredictionSetup';
import { usePredictionSeries } from '../../PredictionDetails/hooks/usePredictionSeries';
import { QuantileMappingFormContent } from './QuantileMappingFormContent';
import type {
    QuantileMappingFormProps,
    ThresholdMap,
} from './quantileMappingFormTypes';
import styles from './QuantileMappingForm.module.css';

const getAllPeriods = (series: PredictionOrgUnitSeries[]) => {
    const periodSet = new Set<string>();

    for (const s of series) {
        s.actualCases?.forEach(ac => periodSet.add(ac.period));
        s.points.forEach(p => periodSet.add(p.period));
    }

    return Array.from(periodSet);
};

const getUnavailableThresholdCount = (
    series: PredictionOrgUnitSeries[],
    thresholdMap: ThresholdMap,
) => (
    series.filter((orgUnitSeries) => {
        const thresholds = thresholdMap?.get(orgUnitSeries.orgUnitId);
        if (!thresholds) return true;
        return !thresholds.some(t => t.value !== null);
    }).length
);

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

    const allPeriods = useMemo(() => getAllPeriods(series), [series]);
    const orgUnitIds = useMemo(() => (
        series.map(s => s.orgUnitId)
    ), [series]);

    const {
        thresholdMap,
        isLoading: isThresholdsLoading,
        error: thresholdsError,
    } = useEndemicThresholds({
        datasetId: prediction.datasetId,
        periodIds: allPeriods,
        locations: orgUnitIds,
        enabled: series.length > 0,
    });

    const isPredictionSetupMissing = !predictionSetup;
    const isLoading = isSeriesLoading
        || isThresholdsLoading
        || (isPredictionSetupMissing && isPredictionSetupLoading);
    const error = seriesError || thresholdsError || (isPredictionSetupMissing ? predictionSetupError : null);
    const unavailableThresholdCount = useMemo(
        () => getUnavailableThresholdCount(series, thresholdMap),
        [series, thresholdMap],
    );

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
            series={series}
            thresholdMap={thresholdMap}
            unavailableThresholdCount={unavailableThresholdCount}
            canDeleteDataValues={canDeleteDataValues}
            isDeleteAuthorityLoading={isDeleteAuthorityLoading}
        />
    );
};
