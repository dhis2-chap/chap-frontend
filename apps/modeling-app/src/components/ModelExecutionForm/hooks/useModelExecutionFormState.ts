import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import i18n from '@dhis2/d2-i18n';
import {
    comparePeriodIds,
    getLastCompletedPeriodId,
    PERIOD_TYPES,
    toDhis2FixedPeriodType,
} from '@dhis2-chap/core';
import { DEFAULT_PERIOD_SETTINGS, type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

export const dimensionItemTypeSchema = z.enum(['DATA_ELEMENT', 'INDICATOR', 'PROGRAM_INDICATOR']);

export const dataItemSchema = z.object({
    id: z.string(),
    displayName: z.string(),
    dimensionItemType: dimensionItemTypeSchema,
});

const orgUnitSchema = z.object({
    id: z.string().min(1, { message: i18n.t('Missing id for org unit') }),
    displayName: z.string().optional(),
    path: z.string().optional(),
});

export const covariateMappingSchema = z.object({
    covariateName: z.string(),
    dataItem: dataItemSchema,
});

export type ModelExecutionPeriodType = typeof PERIOD_TYPES.WEEK | typeof PERIOD_TYPES.MONTH;

const isPeriodRangeValid = (
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

const isCompletedPeriod = (
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

export const createModelExecutionFormSchema = (
    periodSettings: Dhis2PeriodSettings = DEFAULT_PERIOD_SETTINGS,
) => (
    z.object({
        name: z.string().min(1, { message: i18n.t('Name is required') }),
        periodType: z.enum(['WEEK', 'MONTH'], { message: i18n.t('Period type is required') }),
        fromPeriodId: z.string().min(1, { message: i18n.t('Start period is required') }),
        toPeriodId: z
            .string()
            .min(1, { message: i18n.t('End period is required') }),
        orgUnits: z.array(orgUnitSchema).min(1, { message: i18n.t('At least one org unit is required') }),
        modelId: z.string().min(1, { message: i18n.t('Please select a model') }),
        covariateMappings: z
            .array(covariateMappingSchema)
            .min(1, { message: i18n.t('Please map the covariates to valid data items') }),
        targetMapping: z.object(
            {
                covariateName: z.string(),
                dataItem: dataItemSchema,
            },
            { message: i18n.t('Please map the target to a valid data item') },
        ),
    })
        .refine((data) => {
            return isPeriodRangeValid(data.fromPeriodId, data.toPeriodId, periodSettings);
        }, { path: ['toPeriodId'], message: i18n.t('End period must be after start period') })
        .refine((data) => {
            return isCompletedPeriod(data.toPeriodId, data.periodType, periodSettings);
        }, { path: ['toPeriodId'], message: i18n.t('End period cannot be in the future') })
);

export const modelExecutionFormSchema = createModelExecutionFormSchema();

export type CovariateMapping = z.infer<typeof covariateMappingSchema>;

export type ModelExecutionFormValues = z.infer<ReturnType<typeof createModelExecutionFormSchema>>;

type UseModelExecutionFormStateOptions = {
    initialValues?: Partial<ModelExecutionFormValues>;
    periodSettings?: Dhis2PeriodSettings;
};

export const useModelExecutionFormState = ({
    initialValues,
    periodSettings = DEFAULT_PERIOD_SETTINGS,
}: UseModelExecutionFormStateOptions = {}) => {
    const methods = useForm<ModelExecutionFormValues>({
        resolver: zodResolver(createModelExecutionFormSchema(periodSettings)),
        defaultValues: {
            name: initialValues?.name ?? '',
            periodType: initialValues?.periodType ?? PERIOD_TYPES.MONTH,
            fromPeriodId: initialValues?.fromPeriodId ?? '',
            toPeriodId: initialValues?.toPeriodId ?? '',
            orgUnits: initialValues?.orgUnits ?? [],
            modelId: initialValues?.modelId ?? '',
            covariateMappings: initialValues?.covariateMappings ?? [],
            targetMapping: initialValues?.targetMapping ?? undefined,
        },
        shouldFocusError: false,
    });

    return {
        methods,
    };
};

export type UseModelExecutionFormStateReturn = ReturnType<typeof useModelExecutionFormState>;
