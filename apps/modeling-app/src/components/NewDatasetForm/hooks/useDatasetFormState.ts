import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import i18n from '@dhis2/d2-i18n';
import { PERIOD_TYPES } from '@dhis2-chap/core';
import {
    baseFormShape,
    covariateMappingSchema,
    isCompletedPeriod,
    isPeriodRangeValid,
} from '../../ModelExecutionForm/hooks/baseFormSchema';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

/** A DHIS2 data item imported under a covariate name the user chooses. */
export const datasetColumnSchema = covariateMappingSchema.extend({
    covariateName: z.string().trim().min(1, { message: i18n.t('Covariate name is required') }),
});

export const createDatasetFormSchema = (periodSettings: Dhis2PeriodSettings) => (
    z.object({
        ...baseFormShape,
        columns: z
            .array(datasetColumnSchema)
            .min(1, { message: i18n.t('Add at least one data column') }),
    })
        .refine(data => (
            isPeriodRangeValid(data.fromPeriodId, data.toPeriodId, periodSettings)
        ), { path: ['toPeriodId'], message: i18n.t('End period must be after start period') })
        .refine(data => (
            isCompletedPeriod(data.toPeriodId, data.periodType, periodSettings)
        ), { path: ['toPeriodId'], message: i18n.t('End period cannot be in the future') })
        .refine((data) => {
            const names = data.columns.map(column => column.covariateName);
            return new Set(names).size === names.length;
        }, { path: ['columns'], message: i18n.t('Covariate names must be unique') })
);

export type DatasetFormValues = z.infer<ReturnType<typeof createDatasetFormSchema>>;

export const EMPTY_COLUMN = { covariateName: '', dataItem: undefined } as unknown as DatasetFormValues['columns'][number];

export const useDatasetFormState = (periodSettings: Dhis2PeriodSettings) => useForm<DatasetFormValues>({
    resolver: zodResolver(createDatasetFormSchema(periodSettings)),
    defaultValues: {
        name: '',
        periodType: PERIOD_TYPES.MONTH,
        fromPeriodId: '',
        toPeriodId: '',
        orgUnits: [],
        columns: [],
    },
    shouldFocusError: false,
});
