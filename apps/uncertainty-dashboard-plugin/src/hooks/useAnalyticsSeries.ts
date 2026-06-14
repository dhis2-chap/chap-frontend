import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { QUANTILE_FIELDS } from '@/constants';
import {
    buildAnalyticsSeries,
    fetchAnalytics,
    getLatestCompleteQuantilePeriodId,
} from '@/api/analytics';
import { parseDashboardFilters } from '@/utils/dashboardFilters';
import { getFallbackPeriodsEndingAt } from '@/utils/periods';
import type {
    DashboardItemFilters,
    OrgUnitOption,
    PluginConfig,
} from '@/types';

type UseAnalyticsSeriesOptions = {
    config: PluginConfig;
    orgUnit: OrgUnitOption | null;
    dashboardItemFilters?: DashboardItemFilters;
};

export const useAnalyticsSeries = ({
    config,
    orgUnit,
    dashboardItemFilters,
}: UseAnalyticsSeriesOptions) => {
    const engine = useDataEngine();
    const parsedFilters = parseDashboardFilters(dashboardItemFilters, config.periodType);
    const dataItemIds = [
        config.targetDataItem.id,
        ...QUANTILE_FIELDS.map(field => config.quantiles[field.key].id),
    ];
    const canQuery = !!orgUnit;

    const query = useQuery({
        queryKey: [
            'analytics',
            dataItemIds,
            orgUnit?.id,
            parsedFilters.periods.periodIds,
        ],
        enabled: canQuery,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
        queryFn: async () => {
            if (!orgUnit) {
                throw new Error(i18n.t('Missing organisation unit filter'));
            }

            const response = await fetchAnalytics(
                dataItemIds,
                parsedFilters.periods.periodIds,
                orgUnit.id,
                engine,
            );

            if (parsedFilters.periods.source !== 'fallback') {
                return response;
            }

            const latestCompleteQuantilePeriodId = getLatestCompleteQuantilePeriodId(config, response);

            if (!latestCompleteQuantilePeriodId) {
                return response;
            }

            const anchoredFallbackPeriods = getFallbackPeriodsEndingAt(
                latestCompleteQuantilePeriodId,
                config.periodType,
            );

            if (anchoredFallbackPeriods.join(';') === parsedFilters.periods.periodIds.join(';')) {
                return response;
            }

            return fetchAnalytics(
                dataItemIds,
                anchoredFallbackPeriods,
                orgUnit.id,
                engine,
            );
        },
    });

    if (!orgUnit) {
        return {
            status: 'invalid' as const,
            message: i18n.t('Select an organisation unit to show this chart.'),
            isLoading: false,
            error: undefined,
            periodSource: parsedFilters.periods.source,
        };
    }

    if (query.isLoading || !query.data) {
        return {
            status: 'loading' as const,
            isLoading: query.isLoading,
            error: query.error,
            periodSource: parsedFilters.periods.source,
        };
    }

    const result = buildAnalyticsSeries({
        config,
        response: query.data,
        fallbackOrgUnitName: orgUnit.displayName,
    });

    if (result.status === 'invalid') {
        return {
            status: 'invalid' as const,
            message: i18n.t(result.message),
            isLoading: false,
            error: query.error,
            periodSource: parsedFilters.periods.source,
        };
    }

    return {
        status: 'valid' as const,
        series: result.series,
        periodType: result.periodType,
        isLoading: false,
        error: query.error,
        periodSource: parsedFilters.periods.source,
    };
};
