import { getFallbackMonthlyPeriods } from './periods';
import type {
    DashboardFilterItem,
    DashboardItemFilters,
    OrgUnitOption,
} from '@/types';

type OrgUnitFilterState =
    | {
        status: 'single';
        orgUnit: OrgUnitOption;
    }
    | {
        status: 'none';
        options: [];
    }
    | {
        status: 'multiple';
        options: OrgUnitOption[];
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

const isConcreteOrgUnitId = (orgUnitId: string): boolean => (
    !orgUnitId.startsWith('OU_GROUP-') &&
    !orgUnitId.startsWith('LEVEL-') &&
    !orgUnitId.startsWith('USER_ORGUNIT')
);

const getOrgUnitOption = (filterItem: DashboardFilterItem): OrgUnitOption | null => {
    const orgUnitId = getOrgUnitId(filterItem);

    if (!orgUnitId || !isConcreteOrgUnitId(orgUnitId)) {
        return null;
    }

    return {
        id: orgUnitId,
        displayName: getFilterItemName(filterItem) ?? orgUnitId,
        ...(filterItem.path ? { path: filterItem.path } : {}),
    };
};

const getUniqueOrgUnitOptions = (orgUnitOptions: OrgUnitOption[]): OrgUnitOption[] => (
    Array.from(new Map(orgUnitOptions.map(orgUnit => [orgUnit.id, orgUnit])).values())
);

const parseOrgUnitFilter = (filters: DashboardItemFilters): OrgUnitFilterState => {
    const orgUnitFilters = filters.ou ?? [];

    if (orgUnitFilters.length === 0) {
        return {
            status: 'none',
            options: [],
        };
    }

    const orgUnitOptions = getUniqueOrgUnitOptions(
        orgUnitFilters
            .map(getOrgUnitOption)
            .filter((orgUnit): orgUnit is OrgUnitOption => !!orgUnit),
    );

    if (orgUnitFilters.length === 1 && orgUnitOptions.length === 1) {
        return {
            status: 'single',
            orgUnit: orgUnitOptions[0],
        };
    }

    return {
        status: 'multiple',
        options: orgUnitOptions,
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
