import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import i18n from '@dhis2/d2-i18n';
import { parseISO, isAfter, isEqual, isFuture } from 'date-fns';
import { PERIOD_TYPES } from '../constants';

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

export const modelExecutionFormSchema = z
    .object({
        name: z.string().min(1, { message: i18n.t('Name is required') }),
        periodType: z.enum(['WEEK', 'MONTH'], { message: i18n.t('Period type is required') }),
        fromDate: z.string().min(1, { message: i18n.t('Start date is required') }),
        toDate: z
            .string()
            .min(1, { message: i18n.t('End date is required') })
            .refine(data => !isFuture(parseISO(data)), { message: i18n.t('End date cannot be in the future') }),
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
        const fromDate = parseISO(data.fromDate);
        const toDate = parseISO(data.toDate);
        return isAfter(toDate, fromDate) || isEqual(toDate, fromDate);
    }, { path: ['toDate'], message: i18n.t('End period must be after start period') });

export type CovariateMapping = z.infer<typeof covariateMappingSchema>;

export type ModelExecutionFormValues = z.infer<typeof modelExecutionFormSchema>;

type UseModelExecutionFormStateOptions = {
    initialValues?: Partial<ModelExecutionFormValues>;
};

export const useModelExecutionFormState = ({
    initialValues,
}: UseModelExecutionFormStateOptions = {}) => {
    const methods = useForm<ModelExecutionFormValues>({
        resolver: zodResolver(modelExecutionFormSchema),
        defaultValues: {
            name: initialValues?.name ?? '',
            periodType: initialValues?.periodType ?? PERIOD_TYPES.MONTH,
            fromDate: initialValues?.fromDate ?? '',
            toDate: initialValues?.toDate ?? '',
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
