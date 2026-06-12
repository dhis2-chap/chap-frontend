import { useDataEngine } from '@dhis2/app-runtime';
import {
    PERIOD_TYPES,
    comparePeriods,
    convertServerToClientPeriod,
    sortPeriods,
} from '@dhis2-chap/core';
import type {
    PredictionOrgUnitSeries,
    QuantileKey,
} from '@dhis2-chap/ui';
import { QUANTILE_FIELDS } from '@/constants';
import type { PluginConfig } from '@/types';
import { inferChartPeriodType } from '@/utils/periods';

type AnalyticsMetadataItem = {
    name?: string;
    displayName?: string;
};

export type AnalyticsResponse = {
    response: {
        metaData?: {
            dimensions?: {
                dx?: string[];
                ou?: string[];
                pe?: string[];
            };
            items?: Record<string, AnalyticsMetadataItem>;
        };
        rows: Array<[string, string, string, string]>;
    };
};

type AnalyticsSeriesResult =
    | {
        status: 'valid';
        series: PredictionOrgUnitSeries;
        periodType: typeof PERIOD_TYPES.MONTH | typeof PERIOD_TYPES.WEEK;
    }
    | {
        status: 'invalid';
        message: string;
    };

const buildAnalyticsDimension = (
    dataItemIds: string[],
    periods: string[],
    orgUnitId: string,
) => `dx:${dataItemIds.join(';')},ou:${orgUnitId},pe:${periods.join(';')}`;

const buildAnalyticsTargetPath = (
    dataItemIds: string[],
    periods: string[],
    orgUnitId: string,
) => {
    const dimension = buildAnalyticsDimension(dataItemIds, periods, orgUnitId);
    return `/api/analytics?paging=false&skipMeta=false&dimension=${dimension}`;
};

const fetchAnalyticsViaAlias = async (
    dataItemIds: string[],
    periods: string[],
    orgUnitId: string,
    dataEngine: ReturnType<typeof useDataEngine>,
): Promise<AnalyticsResponse> => {
    const aliasResult = await dataEngine.mutate({
        resource: 'query/alias',
        type: 'create' as const,
        data: {
            target: buildAnalyticsTargetPath(dataItemIds, periods, orgUnitId),
        },
    });
    const aliasId = (aliasResult as { id?: string }).id;

    if (!aliasId) {
        throw new Error('Failed to create query alias: no id in response');
    }

    return await dataEngine.query({
        response: {
            resource: `query/alias/${aliasId}`,
        },
    }) as AnalyticsResponse;
};

export const fetchAnalytics = async (
    dataItemIds: string[],
    periods: string[],
    orgUnitId: string,
    dataEngine: ReturnType<typeof useDataEngine>,
): Promise<AnalyticsResponse> => {
    try {
        return await fetchAnalyticsViaAlias(dataItemIds, periods, orgUnitId, dataEngine);
    } catch (error) {
        console.warn(
            'Query alias creation failed, falling back to direct analytics query.',
            error,
        );

        return await dataEngine.query({
            response: {
                resource: 'analytics',
                params: {
                    paging: false,
                    skipMeta: false,
                    dimension: buildAnalyticsDimension(dataItemIds, periods, orgUnitId),
                },
            },
        }) as AnalyticsResponse;
    }
};

const getMetadataName = (
    response: AnalyticsResponse,
    id: string,
): string | undefined => {
    const item = response.response.metaData?.items?.[id];
    return item?.displayName ?? item?.name;
};

const getOrgUnitIds = (response: AnalyticsResponse): string[] => {
    const metadataOrgUnits = response.response.metaData?.dimensions?.ou ?? [];

    if (metadataOrgUnits.length > 0) {
        return metadataOrgUnits;
    }

    return Array.from(new Set(response.response.rows.map(row => row[1])));
};

const getPeriodIds = (response: AnalyticsResponse): string[] => {
    const metadataPeriods = response.response.metaData?.dimensions?.pe ?? [];

    if (metadataPeriods.length > 0) {
        return metadataPeriods;
    }

    return Array.from(new Set(response.response.rows.map(row => row[2])));
};

type QuantilesByPeriod = Map<string, Partial<Record<QuantileKey, number>>>;

const buildQuantilesByPeriod = (
    config: PluginConfig,
    response: AnalyticsResponse,
): QuantilesByPeriod => {
    const quantileKeyByDataItemId = new Map<string, QuantileKey>(
        (Object.entries(config.quantiles) as Array<[QuantileKey, { id: string }]>).map(([key, dataItem]) => [
            dataItem.id,
            key,
        ]),
    );
    const quantilesByPeriod: QuantilesByPeriod = new Map();

    for (const [dataItemId, , periodId, rawValue] of response.response.rows) {
        const quantileKey = quantileKeyByDataItemId.get(dataItemId);

        if (!quantileKey) {
            continue;
        }

        const value = Number(rawValue);

        if (!Number.isFinite(value)) {
            continue;
        }

        const quantiles = quantilesByPeriod.get(periodId) ?? {};
        quantiles[quantileKey] = value;
        quantilesByPeriod.set(periodId, quantiles);
    }

    return quantilesByPeriod;
};

const hasCompleteQuantiles = (
    quantiles?: Partial<Record<QuantileKey, number>>,
): quantiles is Record<QuantileKey, number> => (
    QUANTILE_FIELDS.every(field => quantiles?.[field.key] !== undefined)
);

export const getLatestCompleteQuantilePeriodId = (
    config: PluginConfig,
    response: AnalyticsResponse,
): string | null => {
    const quantilesByPeriod = buildQuantilesByPeriod(config, response);
    const completePeriodIds = Array.from(quantilesByPeriod.entries())
        .filter(([, quantiles]) => hasCompleteQuantiles(quantiles))
        .map(([periodId]) => periodId);

    if (completePeriodIds.length === 0) {
        return null;
    }

    const periodTypeResult = inferChartPeriodType(completePeriodIds);

    if (periodTypeResult.status !== 'valid') {
        return null;
    }

    return sortPeriods(completePeriodIds, periodTypeResult.periodType).at(-1) ?? null;
};

export const buildAnalyticsSeries = ({
    config,
    response,
    fallbackOrgUnitName,
}: {
    config: PluginConfig;
    response: AnalyticsResponse;
    fallbackOrgUnitName: string;
}): AnalyticsSeriesResult => {
    const orgUnitIds = getOrgUnitIds(response);

    if (orgUnitIds.length !== 1) {
        return {
            status: 'invalid',
            message: 'Select exactly one organisation unit in the dashboard filters.',
        };
    }

    const periodIds = getPeriodIds(response);

    if (periodIds.length === 0) {
        return {
            status: 'invalid',
            message: 'No data found for the selected filters.',
        };
    }

    const periodTypeResult = inferChartPeriodType(periodIds);

    if (periodTypeResult.status === 'mixed') {
        return {
            status: 'invalid',
            message: 'Select only weekly or only monthly periods.',
        };
    }

    if (periodTypeResult.status === 'unsupported') {
        return {
            status: 'invalid',
            message: 'This chart supports weekly and monthly periods only.',
        };
    }

    const orgUnitId = orgUnitIds[0];
    const periodType = periodTypeResult.periodType;
    const sortedPeriods = sortPeriods(periodIds, periodType);
    const actualCasesByPeriod = new Map<string, number | null>();
    const quantilesByPeriod = buildQuantilesByPeriod(config, response);

    for (const [dataItemId, rowOrgUnitId, periodId, rawValue] of response.response.rows) {
        if (rowOrgUnitId !== orgUnitId) {
            continue;
        }

        const value = Number(rawValue);

        if (!Number.isFinite(value)) {
            continue;
        }

        if (dataItemId === config.targetDataItem.id) {
            actualCasesByPeriod.set(periodId, value);
        }
    }

    const points = sortedPeriods.flatMap((periodId) => {
        const quantiles = quantilesByPeriod.get(periodId);

        if (!hasCompleteQuantiles(quantiles)) {
            return [];
        }

        return [{
            period: periodId,
            periodLabel: getMetadataName(response, periodId)
                ?? convertServerToClientPeriod(periodId, periodType),
            quantiles: {
                quantile_low: quantiles.quantile_low,
                quantile_mid_low: quantiles.quantile_mid_low,
                median: quantiles.median,
                quantile_mid_high: quantiles.quantile_mid_high,
                quantile_high: quantiles.quantile_high,
            },
        }];
    });

    if (points.length === 0) {
        return {
            status: 'invalid',
            message: 'No complete uncertainty data found for the selected filters.',
        };
    }

    return {
        status: 'valid',
        periodType,
        series: {
            targetId: config.targetDataItem.id,
            orgUnitId,
            orgUnitName: getMetadataName(response, orgUnitId) ?? fallbackOrgUnitName,
            points,
            actualCases: Array.from(actualCasesByPeriod.entries())
                .map(([period, value]) => ({ period, value }))
                .sort((a, b) => comparePeriods(a.period, b.period, periodType)),
        },
    };
};
