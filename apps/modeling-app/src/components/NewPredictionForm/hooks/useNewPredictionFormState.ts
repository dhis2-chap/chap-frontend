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
} from '../utils/predictionPeriods';

export type NewPredictionFormValues = {
    name: string;
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
        absoluteValue: z.string().nullable(),
    }).superRefine((data, ctx) => {
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
            absoluteValue: null,
        },
        shouldFocusError: false,
    });

    return { methods };
};

export const PERIOD_TYPE_FALLBACK = PERIOD_TYPES.MONTH;
