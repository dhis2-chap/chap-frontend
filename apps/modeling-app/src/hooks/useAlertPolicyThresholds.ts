import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    buildEndemicThresholdMap,
    DatasetsService,
    getThresholdLineRoles,
    OpenAPI,
    type AlertLevel,
    type AlertPolicyRead,
    type EndemicThresholdPoint,
    type PredictionOrgUnitSeries,
    type ThresholdChartLine,
} from '@dhis2-chap/ui';
import { describeThreshold } from '@/components/BackendAlerts/describeAlertLevel';
import { getThresholdQueryState } from '@/utils/thresholdQueryState';
import { THRESHOLDS_CACHE_TIME, useThresholdScope } from './useEndemicThresholds';

type Props = {
    datasetId: number;
    series: PredictionOrgUnitSeries[];
    policies: AlertPolicyRead[];
    enabled: boolean;
};

// Levels often share threshold parameters and differ only in the exceedance
// probability, so one line is drawn per distinct set of parameters.
const getDistinctThresholdParams = (policies: AlertPolicyRead[]) => {
    const byParams = new Map<string, AlertLevel['thresholdParams']>();
    for (const level of policies.flatMap(policy => policy.levels ?? [])) {
        byParams.set(JSON.stringify(level.thresholdParams), level.thresholdParams);
    }
    return [...byParams.values()];
};

export const useAlertPolicyThresholds = ({ datasetId, series, policies, enabled }: Props) => {
    const { periodIds, locations } = useThresholdScope(series);
    const paramsList = useMemo(() => getDistinctThresholdParams(policies), [policies]);
    const isQueryEnabled = enabled && paramsList.length > 0 && periodIds.length > 0;
    const query = useQuery<Map<string, EndemicThresholdPoint[]>[], ApiError>({
        queryKey: ['alert-policy-thresholds', OpenAPI.BASE, datasetId, periodIds, locations, paramsList],
        queryFn: () => Promise.all(paramsList.map(async (params) => {
            const response = await DatasetsService.computeThresholdsV1AnalyticsThresholdsPost({
                datasetId, periodIds, locations, params,
            });
            return buildEndemicThresholdMap(response.entries, getThresholdLineRoles(response.lines));
        })),
        enabled: isQueryEnabled,
        staleTime: Infinity,
        cacheTime: THRESHOLDS_CACHE_TIME,
        retry: false,
    });
    const linesByOrgUnit = useMemo(() => {
        const result = new Map<string, ThresholdChartLine[]>();
        query.data?.forEach((thresholds, index) => {
            const label = describeThreshold(paramsList[index]);
            thresholds.forEach((points, orgUnit) => {
                result.set(orgUnit, [...result.get(orgUnit) ?? [], { label, points }]);
            });
        });
        return result;
    }, [query.data, paramsList]);

    return {
        linesByOrgUnit,
        ...getThresholdQueryState(isQueryEnabled, query),
        error: isQueryEnabled ? query.error : null,
        refetch: query.refetch,
    };
};
