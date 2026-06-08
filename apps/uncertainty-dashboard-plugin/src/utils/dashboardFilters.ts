import i18n from '@dhis2/d2-i18n';
import { getFallbackMonthlyPeriods } from './periods';
import type {
    DashboardFilterItem,
    DashboardItemFilters,
} from '@/types';

type OrgUnitFilterState =
    | {
        status: 'valid';
        orgUnitId: string;
        orgUnitName: string;
    }
    | {
        status: 'invalid';
        message: string;
    };

type PeriodFilterState = {
    periodIds: string[];
    source: 'dashboard' | 'fallback';
};

export type ParsedDashboardFilters = {
    orgUnit: OrgUnitFilterState;
    periods: PeriodFilterState;
};

const getFilterItemName = (filterItem: DashboardFilterItem): string | undefined => (
    filterItem.displayName ?? filterItem.name
);

const getOrgUnitId = (filterItem: DashboardFilterItem): string | undefined => {
    if (filterItem.path) {
        const pathParts = filterItem.path.split('/').filter(Boolean);
        return pathParts[pathParts.length - 1];
    }

    return filterItem.id;
};

const parseOrgUnitFilter = (filters: DashboardItemFilters): OrgUnitFilterState => {
    const orgUnitFilters = filters.ou ?? [];

    if (orgUnitFilters.length !== 1) {
        return {
            status: 'invalid',
            message: i18n.t('Select exactly one organisation unit in the dashboard filters.'),
        };
    }

    const [filterItem] = orgUnitFilters;
    const orgUnitId = getOrgUnitId(filterItem);

    if (!orgUnitId) {
        return {
            status: 'invalid',
            message: i18n.t('Select exactly one organisation unit in the dashboard filters.'),
        };
    }

    return {
        status: 'valid',
        orgUnitId,
        orgUnitName: getFilterItemName(filterItem) ?? orgUnitId,
    };
};

const parsePeriodFilter = (filters: DashboardItemFilters): PeriodFilterState => {
    const periodIds = (filters.pe ?? [])
        .map(filterItem => filterItem.id)
        .filter((periodId): periodId is string => !!periodId);

    if (periodIds.length > 0) {
        return {
            periodIds,
            source: 'dashboard',
        };
    }

    return {
        periodIds: getFallbackMonthlyPeriods(),
        source: 'fallback',
    };
};

export const parseDashboardFilters = (
    filters: DashboardItemFilters | undefined,
): ParsedDashboardFilters => {
    const safeFilters = filters ?? {};

    return {
        orgUnit: parseOrgUnitFilter(safeFilters),
        periods: parsePeriodFilter(safeFilters),
    };
};
