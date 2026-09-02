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

const thresholdParamsSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('seasonal'),
        stdMultiplier: z.number(),
    }),
    z.object({
        type: z.literal('percentile'),
        quantile: z.tuple([z.number(), z.number()]),
        baselineYears: z.number().int().min(1).nullable(),
    }),
]);

export const importLocationStateSchema = z
    .object({
        alertProbability: outbreakProbabilitySchema.optional(),
        thresholdParams: thresholdParamsSchema.optional(),
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
    endemic_threshold: z.string(),
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
