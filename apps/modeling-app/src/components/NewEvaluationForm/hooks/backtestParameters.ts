import i18n from '@dhis2/d2-i18n';
import { z } from 'zod';

const positiveCount = z.number({
    required_error: i18n.t('Enter a whole number greater than zero'),
    invalid_type_error: i18n.t('Enter a whole number greater than zero'),
}).int(i18n.t('Enter a whole number greater than zero'))
    .positive(i18n.t('Enter a whole number greater than zero'));

export const backtestParametersSchema = z.object({
    nPeriods: positiveCount,
    nSplits: positiveCount,
    stride: positiveCount,
    nRetrain: positiveCount,
    futureWeatherProvider: z.string().min(1, i18n.t('Select a future-weather provider')),
}).refine(data => data.nRetrain <= data.nSplits, {
    path: ['nRetrain'],
    message: i18n.t('Number of training runs must not exceed the number of splits'),
});

export type BacktestParameters = z.infer<typeof backtestParametersSchema>;
