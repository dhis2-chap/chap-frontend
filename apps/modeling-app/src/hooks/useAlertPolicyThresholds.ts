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
import { getThresholdQueryState } from '@/utils/thresholdQueryState';
import { THRESHOLDS_CACHE_TIME, useThresholdScope } from './useEndemicThresholds';

type Props = {
    datasetId: number;
    series: PredictionOrgUnitSeries[];
    policies: AlertPolicyRead[];
    enabled: boolean;
};

// Same colour as the exploration line: the level colours belong to the alert
// shading, since levels sharing a line differ only in exceedance probability.
const POLICY_LINE_COLOR = '#212934';

// Levels of a policy often share threshold parameters and differ only in the
// exceedance probability, so one line is drawn per distinct set of parameters.
type PolicyLevel = NonNullable<AlertPolicyRead['levels']>[number];

const getPolicyLines = (policies: AlertPolicyRead[]) => policies.flatMap((policy) => {
    const byParams = new Map<string, { params: PolicyLevel['thresholdParams']; levels: string[] }>();
    for (const level of policy.levels ?? []) {
        const key = JSON.stringify(level.thresholdParams);
        const line = byParams.get(key) ?? { params: level.thresholdParams, levels: [] };
        line.levels.push(level.name);
        byParams.set(key, line);
    }
    return [...byParams.values()].map((line, index) => ({
        id: `policy-threshold-${policy.id}-${index}`,
        label: `${policy.name}: ${line.levels.join(', ')}`,
        params: line.params,
    }));
});

export const useAlertPolicyThresholds = ({ datasetId, series, policies, enabled }: Props) => {
    const { periodIds, locations } = useThresholdScope(series);
    const lines = useMemo(() => getPolicyLines(policies), [policies]);
    const isQueryEnabled = enabled && lines.length > 0 && periodIds.length > 0;
    const query = useQuery<Map<string, EndemicThresholdPoint[]>[], ApiError>({
        queryKey: ['alert-policy-thresholds', OpenAPI.BASE, datasetId, periodIds, locations, lines.map(line => line.params)],
        queryFn: () => Promise.all(lines.map(async ({ params }) => {
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
            const { id, label } = lines[index];
            thresholds.forEach((points, orgUnit) => {
                const orgUnitLines = result.get(orgUnit) ?? [];
                orgUnitLines.push({ id, label, color: POLICY_LINE_COLOR, points });
                result.set(orgUnit, orgUnitLines);
            });
        });
        return result;
    }, [query.data, lines]);

    return {
        linesByOrgUnit,
        ...getThresholdQueryState(isQueryEnabled, query),
        error: isQueryEnabled ? query.error : null,
        refetch: query.refetch,
    };
};
