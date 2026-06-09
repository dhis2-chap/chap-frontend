import i18n from '@dhis2/d2-i18n';
import {
    OUTBREAK_PROBABILITY_OPTIONS,
    type OutbreakProbability,
} from '@dhis2-chap/ui';
import * as z from 'zod';

const outbreakProbabilitySchema = z.custom<OutbreakProbability>(
    value => OUTBREAK_PROBABILITY_OPTIONS.includes(value as OutbreakProbability),
    { message: i18n.t('Alert probability is required') },
);

export const importLocationStateSchema = z
    .object({
        alertProbability: outbreakProbabilitySchema.optional(),
        useAlertOutputs: z.boolean().optional(),
    })
    .passthrough()
    .optional();

export const quantileMappingSchema = z.object({
    quantile_low: z.string().min(1, { message: 'Quantile low is required' }),
    quantile_high: z.string().min(1, { message: 'Quantile high is required' }),
    median: z.string().min(1, { message: 'Median is required' }),
    quantile_mid_low: z.string().min(1, { message: 'Quantile mid low is required' }),
    quantile_mid_high: z.string().min(1, { message: 'Quantile mid high is required' }),
    use_alert_outputs: z.boolean(),
    alert_probability: outbreakProbabilitySchema,
    outbreak_indicator: z.string(),
}).superRefine((values, context) => {
    if (values.use_alert_outputs && !values.outbreak_indicator) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['outbreak_indicator'],
            message: i18n.t('Outbreak indicator is required'),
        });
    }
});

export type QuantileMappingFormValues = z.infer<typeof quantileMappingSchema>;
export type MappingField = keyof QuantileMappingFormValues;

export const quantileMappingFields = [
    'quantile_low',
    'quantile_high',
    'median',
    'quantile_mid_low',
    'quantile_mid_high',
] as const satisfies MappingField[];

export type QuantileMappingField = typeof quantileMappingFields[number];
