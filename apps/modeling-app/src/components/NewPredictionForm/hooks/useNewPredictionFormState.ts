import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import i18n from '@dhis2/d2-i18n';
import {
    comparePeriodIds,
    PERIOD_TYPES,
} from '@dhis2-chap/core';
import {
    SupportedPeriodType,
} from '../utils/predictionPeriods';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

export type NewPredictionFormValues = {
    name: string;
    periodId: string | null;
};

type SchemaContext = {
    periodType: SupportedPeriodType;
    fromPeriod: string;
    anchorPeriod: string;
    periodSettings: Dhis2PeriodSettings;
};

const comparePredictionPeriods = (
    a: string,
    b: string,
    periodSettings: Dhis2PeriodSettings,
) => comparePeriodIds({
    a,
    b,
    calendar: periodSettings.calendar,
    locale: periodSettings.locale,
});

const createNewPredictionFormSchema = ({
    fromPeriod,
    anchorPeriod,
    periodSettings,
}: SchemaContext) => (
    z.object({
        name: z.string().min(1, { message: i18n.t('Name is required') }),
        periodId: z.string().nullable(),
    }).superRefine((data, ctx) => {
        if (!data.periodId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['periodId'],
                message: i18n.t('Please select a period'),
            });
            return;
        }

        try {
            if (comparePredictionPeriods(data.periodId, anchorPeriod, periodSettings) > 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['periodId'],
                    message: i18n.t('Period must be completed (cannot be later than last completed period)'),
                });
                return;
            }

            if (comparePredictionPeriods(data.periodId, fromPeriod, periodSettings) >= 0) {
                return;
            }
        } catch {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['periodId'],
                message: i18n.t('Invalid period'),
            });
            return;
        }

        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['periodId'],
            message: i18n.t('Period is before training start'),
        });
    })
);

type UseNewPredictionFormStateOptions = {
    name: string;
    periodType: SupportedPeriodType;
    fromPeriod: string;
    anchorPeriod: string;
    periodSettings: Dhis2PeriodSettings;
};

export const useNewPredictionFormState = ({
    name,
    periodType,
    fromPeriod,
    anchorPeriod,
    periodSettings,
}: UseNewPredictionFormStateOptions) => {
    const schema = useMemo(
        () => createNewPredictionFormSchema({ periodType, fromPeriod, anchorPeriod, periodSettings }),
        [periodType, fromPeriod, anchorPeriod, periodSettings],
    );

    const methods = useForm<NewPredictionFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name,
            periodId: null,
        },
        shouldFocusError: false,
    });

    return { methods };
};

export const PERIOD_TYPE_FALLBACK = PERIOD_TYPES.MONTH;
