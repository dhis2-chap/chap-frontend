import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import i18n from '@dhis2/d2-i18n';
import { PERIOD_TYPES } from '@dhis2-chap/core';
import {
    baseFormShape,
    covariateMappingSchema,
    dataItemSchema,
    isCompletedPeriod,
    isPeriodRangeValid,
} from './baseFormSchema';
import { DEFAULT_PERIOD_SETTINGS, type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

export {
    baseFormShape,
    covariateMappingSchema,
    dataItemSchema,
    dimensionItemTypeSchema,
    orgUnitSchema,
    isCompletedPeriod,
    isPeriodRangeValid,
} from './baseFormSchema';
export type { BaseFormValues, ModelExecutionPeriodType } from './baseFormSchema';

export const createModelExecutionFormSchema = (
    periodSettings: Dhis2PeriodSettings = DEFAULT_PERIOD_SETTINGS,
) => (
    z.object({
        ...baseFormShape,
        modelId: z.string().min(1, { message: i18n.t('Please select a model') }),
        covariateMappings: z.array(covariateMappingSchema),
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
