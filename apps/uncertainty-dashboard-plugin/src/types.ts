import { z } from 'zod';
import { PERIOD_TYPES } from '@dhis2-chap/core';
import type { QuantileKey } from '@dhis2-chap/ui';
import { DEFAULT_CHART_PERIOD_TYPE } from '@/constants';

export const TargetDimensionItemTypeSchema = z.enum([
    'PROGRAM_DATA_ELEMENT',
    'INDICATOR',
    'PROGRAM_INDICATOR',
    'DATA_ELEMENT',
]);

export const DataItemSchema = z.object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    dimensionItemType: TargetDimensionItemTypeSchema,
});

export const OrgUnitSchema = z.object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    path: z.string().optional(),
});

export const QuantileDataItemSchema = DataItemSchema.extend({
    dimensionItemType: z.literal('DATA_ELEMENT'),
});

export const ChartPeriodTypeSchema = z.enum([
    PERIOD_TYPES.MONTH,
    PERIOD_TYPES.WEEK,
]);

export const PluginConfigSchema = z.object({
    version: z.literal(1),
    title: z.string().optional(),
    periodType: ChartPeriodTypeSchema.default(DEFAULT_CHART_PERIOD_TYPE),
    targetDataItem: DataItemSchema,
    quantiles: z.object({
        quantile_low: QuantileDataItemSchema,
        quantile_mid_low: QuantileDataItemSchema,
        median: QuantileDataItemSchema,
        quantile_mid_high: QuantileDataItemSchema,
        quantile_high: QuantileDataItemSchema,
    }),
    fallbackOrgUnit: OrgUnitSchema.optional(),
});

export type TargetDimensionItemType = z.infer<typeof TargetDimensionItemTypeSchema>;
export type DataItemOption = z.infer<typeof DataItemSchema>;
export type OrgUnitOption = z.infer<typeof OrgUnitSchema>;
export type ChartPeriodType = z.infer<typeof ChartPeriodTypeSchema>;
export type PluginConfig = z.infer<typeof PluginConfigSchema>;

export type DashboardFilterItem = {
    id?: string;
    name?: string;
    displayName?: string;
    path?: string;
};

export type DashboardItemFilters = {
    pe?: DashboardFilterItem[];
    ou?: DashboardFilterItem[];
    [dimension: string]: DashboardFilterItem[] | undefined;
};

export type DashboardMode = 'view' | 'edit' | 'print';

export type DashboardItemDetails = {
    itemTitle?: string;
    appUrl?: string;
    onRemove?: () => void;
};

export type DashboardPluginProps = {
    dashboardItemId: string;
    dashboardItemFilters?: DashboardItemFilters;
    dashboardMode?: DashboardMode;
    setDashboardItemDetails?: (details: DashboardItemDetails) => void;
    cacheId?: string;
    isParentCached?: boolean;
};

export type QuantileDataItems = Record<QuantileKey, DataItemOption>;
