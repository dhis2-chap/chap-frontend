import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { canonicalizePeriodId } from '@dhis2-chap/core';
import { DatasetsService, OpenAPI, PredictionsService, type AlertPolicyRead, type ApiError, type PredictionEntry, type PredictionOrgUnitSeries, type ThresholdResponse } from '@dhis2-chap/ui';
import { buildPolicyOutbreakIndicators, getAlertLevelQuantile } from '@/components/PageContent/PredictionImport/utils/policyOutbreakIndicators';
import { getThresholdQueryState } from '@/utils/thresholdQueryState';

export const usePolicyOutbreakIndicators = ({ predictionId, datasetId, policy, series, enabled }: {
    predictionId: number;
    datasetId: number;
    policy?: AlertPolicyRead | null;
    series: PredictionOrgUnitSeries[];
    enabled: boolean;
}) => {
    const periodIds = [...new Set(series.flatMap(region => region.points.map(point => canonicalizePeriodId(point.period))))];
    const locations = series.map(region => region.orgUnitId);
    const isQueryEnabled = enabled && !!policy;
    const results = useQuery<{ entries: PredictionEntry[]; thresholds: ThresholdResponse[] }, ApiError>({
        queryKey: ['policy-outbreak-indicators', OpenAPI.BASE, predictionId, datasetId, policy, periodIds, locations],
        enabled: isQueryEnabled,
        staleTime: Infinity,
        retry: 0,
        queryFn: async () => {
            if (!policy?.levels?.length) throw new Error('The alert policy has no levels');
            const [entries, thresholds] = await Promise.all([
                PredictionsService.getPredictionEntriesV1AnalyticsPredictionEntryPredictionIdGet(
                    predictionId, [...new Set(policy.levels.map(getAlertLevelQuantile))],
                ),
                Promise.all(policy.levels.map(level => DatasetsService.computeThresholdsV1AnalyticsThresholdsPost({
                    datasetId, periodIds, locations, params: level.thresholdParams,
                }))),
            ]);
            return { entries, thresholds };
        },
    });
    const indicators = useMemo(() => policy && results.data
        ? buildPolicyOutbreakIndicators(series, policy, results.data.entries, results.data.thresholds)
        : [], [series, policy, results.data]);
    return {
        indicators,
        ...getThresholdQueryState(isQueryEnabled, results),
        error: isQueryEnabled ? results.error : null,
        retry: () => void results.refetch(),
        skippedCount: series.reduce((count, region) => count + region.points.length, 0) - indicators.length,
    };
};
