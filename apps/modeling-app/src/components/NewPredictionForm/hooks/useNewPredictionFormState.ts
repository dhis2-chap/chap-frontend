import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import i18n from '@dhis2/d2-i18n';
import { PERIOD_TYPES } from '@dhis2-chap/ui';
import {
    SupportedPeriodType,
    inputValueToPeriod,
    isPeriodAfter,
    isPeriodBefore,
    shiftPeriod,
} from '../utils/predictionPeriods';

export const PERIOD_MODES = {
    OFFSET: 'offset',
    ABSOLUTE: 'absolute',
} as const;

export type PeriodMode = typeof PERIOD_MODES[keyof typeof PERIOD_MODES];

export type NewPredictionFormValues = {
    name: string;
    mode: PeriodMode;
    offsetValue: number | null;
    absoluteValue: string | null;
};

type SchemaContext = {
    periodType: SupportedPeriodType;
    fromPeriod: string;
    anchorPeriod: string;
};

const createNewPredictionFormSchema = ({ periodType, fromPeriod, anchorPeriod }: SchemaContext) => (
    z.object({
        name: z.string().min(1, { message: i18n.t('Name is required') }),
        mode: z.enum([PERIOD_MODES.OFFSET, PERIOD_MODES.ABSOLUTE]),
        offsetValue: z.number().int().nullable(),
        absoluteValue: z.string().nullable(),
    }).superRefine((data, ctx) => {
        if (data.mode === PERIOD_MODES.OFFSET) {
            if (data.offsetValue === null || data.offsetValue === undefined || Number.isNaN(data.offsetValue)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['offsetValue'],
                    message: i18n.t('Enter an offset (0 or negative)'),
                });
                return;
            }
            if (data.offsetValue > 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['offsetValue'],
                    message: i18n.t('Offset must be 0 or negative'),
                });
                return;
            }
            const resolved = shiftPeriod(anchorPeriod, periodType, data.offsetValue);
            if (!resolved) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['offsetValue'],
                    message: i18n.t('Invalid offset'),
                });
                return;
            }
            if (isPeriodBefore(resolved, fromPeriod, periodType)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['offsetValue'],
                    message: i18n.t('Resolved period is before training start'),
                });
            }
            return;
        }

        if (!data.absoluteValue) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['absoluteValue'],
                message: i18n.t('Please select a period'),
            });
            return;
        }
        const resolved = inputValueToPeriod(data.absoluteValue, periodType);
        if (!resolved) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['absoluteValue'],
                message: i18n.t('Invalid period'),
            });
            return;
        }
        if (isPeriodAfter(resolved, anchorPeriod, periodType)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['absoluteValue'],
                message: i18n.t('Period must be completed (cannot be later than last completed period)'),
            });
            return;
        }
        if (isPeriodBefore(resolved, fromPeriod, periodType)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['absoluteValue'],
                message: i18n.t('Period is before training start'),
            });
        }
    })
);

type UseNewPredictionFormStateOptions = {
    name: string;
    periodType: SupportedPeriodType;
    fromPeriod: string;
    anchorPeriod: string;
};

export const useNewPredictionFormState = ({
    name,
    periodType,
    fromPeriod,
    anchorPeriod,
}: UseNewPredictionFormStateOptions) => {
    const schema = useMemo(
        () => createNewPredictionFormSchema({ periodType, fromPeriod, anchorPeriod }),
        [periodType, fromPeriod, anchorPeriod],
    );

    const methods = useForm<NewPredictionFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name,
            mode: PERIOD_MODES.OFFSET,
            offsetValue: 0,
            absoluteValue: null,
        },
        shouldFocusError: false,
    });

    return { methods };
};

export const PERIOD_TYPE_FALLBACK = PERIOD_TYPES.MONTH;
