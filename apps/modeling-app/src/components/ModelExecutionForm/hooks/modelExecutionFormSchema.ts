import { z } from 'zod';
import i18n from '@dhis2/d2-i18n';
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

export type CovariateMapping = z.infer<typeof covariateMappingSchema>;

export type ModelExecutionFormValues = z.infer<ReturnType<typeof createModelExecutionFormSchema>>;
