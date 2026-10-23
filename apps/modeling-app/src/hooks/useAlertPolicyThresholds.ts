import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    buildEndemicThresholdMap,
    DatasetsService,
    getThresholdLineRoles,
    OpenAPI,
    type AlertPolicyRead,
    type EndemicThresholdPoint,
    type PredictionOrgUnitSeries,
    type ThresholdChartLine,
} from '@dhis2-chap/ui';
import { getAlertColor, getAlertLevelDisplay, type AlertPolicyDisplay } from '@/components/BackendAlerts/alertLevelDisplay';
import { getThresholdQueryState } from '@/utils/thresholdQueryState';
import { THRESHOLDS_CACHE_TIME, useThresholdScope } from './useEndemicThresholds';

type Props = {
    datasetId: number;
    series: PredictionOrgUnitSeries[];
    policies: AlertPolicyRead[];
    displays?: Record<number, AlertPolicyDisplay | undefined>;
    enabled: boolean;
};

export const useAlertPolicyThresholds = ({ datasetId, series, policies, displays, enabled }: Props) => {
    const { periodIds, locations } = useThresholdScope(series);
    const levels = useMemo(() => policies.flatMap(policy => (policy.levels ?? []).map(level => ({ policy, level }))), [policies]);
    const isQueryEnabled = enabled && levels.length > 0 && periodIds.length > 0;
    const query = useQuery<Map<string, EndemicThresholdPoint[]>[], ApiError>({
        queryKey: ['alert-policy-thresholds', OpenAPI.BASE, datasetId, periodIds, locations,
            levels.map(({ policy, level }) => [policy.id, level.name, level.thresholdParams])],
        queryFn: () => Promise.all(levels.map(async ({ level }) => {
            const response = await DatasetsService.computeThresholdsV1AnalyticsThresholdsPost({
                datasetId, periodIds, locations, params: level.thresholdParams,
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
            const { policy, level } = levels[index];
            const display = getAlertLevelDisplay(level.name, policy, displays?.[policy.id]);
            thresholds.forEach((points, orgUnit) => {
                const lines = result.get(orgUnit) ?? [];
                lines.push({
                    id: `policy-threshold-${policy.id}-${level.name}`,
                    label: `${policy.name}: ${level.name}`,
                    color: getAlertColor(display.color).color,
                    points,
                });
                result.set(orgUnit, lines);
            });
        });
        return result;
    }, [query.data, levels, displays]);

    return {
        linesByOrgUnit,
        ...getThresholdQueryState(isQueryEnabled, query),
        error: isQueryEnabled ? query.error : null,
        refetch: query.refetch,
    };
};
