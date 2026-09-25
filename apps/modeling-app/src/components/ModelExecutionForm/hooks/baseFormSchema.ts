import { z } from 'zod';
import i18n from '@dhis2/d2-i18n';
import {
    comparePeriodIds,
    getLastCompletedPeriodId,
    PERIOD_TYPES,
    toDhis2FixedPeriodType,
} from '@dhis2-chap/core';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

export const dimensionItemTypeSchema = z.enum(['DATA_ELEMENT', 'PROGRAM_DATA_ELEMENT', 'INDICATOR', 'PROGRAM_INDICATOR']);

export const dataItemSchema = z.object({
    id: z.string(),
    displayName: z.string(),
    dimensionItemType: dimensionItemTypeSchema,
});

export const orgUnitSchema = z.object({
    id: z.string().min(1, { message: i18n.t('Missing id for org unit') }),
    displayName: z.string().optional(),
    path: z.string().optional(),
});

export const covariateMappingSchema = z.object({
    covariateName: z.string(),
    dataItem: dataItemSchema,
});

export type ModelExecutionPeriodType = typeof PERIOD_TYPES.WEEK | typeof PERIOD_TYPES.MONTH;

/**
 * Fields shared by every form that imports DHIS2 data: name, period range and org units.
 * Forms built on these can reuse the NameInput, PeriodSelector and LocationSelector sections.
 */
export const baseFormShape = {
    name: z.string().min(1, { message: i18n.t('Name is required') }),
    periodType: z.enum(['WEEK', 'MONTH'], { message: i18n.t('Period type is required') }),
    fromPeriodId: z.string().min(1, { message: i18n.t('Start period is required') }),
    toPeriodId: z.string().min(1, { message: i18n.t('End period is required') }),
    orgUnits: z.array(orgUnitSchema).min(1, { message: i18n.t('At least one org unit is required') }),
};

export type BaseFormValues = z.infer<z.ZodObject<typeof baseFormShape>>;

export const isPeriodRangeValid = (
    fromPeriodId: string,
    toPeriodId: string,
    settings: Dhis2PeriodSettings,
) => {
    if (!fromPeriodId || !toPeriodId) {
        return true;
    }

    try {
        return comparePeriodIds({
            a: toPeriodId,
            b: fromPeriodId,
            calendar: settings.calendar,
            locale: settings.locale,
        }) >= 0;
    } catch {
        return false;
    }
};

export const isCompletedPeriod = (
    toPeriodId: string,
    periodType: ModelExecutionPeriodType,
    settings: Dhis2PeriodSettings,
) => {
    if (!toPeriodId) {
        return true;
    }

    const dhis2PeriodType = toDhis2FixedPeriodType(periodType);
    if (!dhis2PeriodType) {
        return false;
    }

    try {
        const lastCompletedPeriodId = getLastCompletedPeriodId({
            periodType: dhis2PeriodType,
            calendar: settings.calendar,
            locale: settings.locale,
            timeZone: settings.timeZone,
        });

        return comparePeriodIds({
            a: toPeriodId,
            b: lastCompletedPeriodId,
            calendar: settings.calendar,
            locale: settings.locale,
        }) <= 0;
    } catch {
        return false;
    }
};
