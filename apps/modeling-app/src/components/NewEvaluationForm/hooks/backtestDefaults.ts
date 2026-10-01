import { PERIOD_TYPES } from '@dhis2-chap/core';
import type { BacktestParameterInfo } from '@dhis2-chap/ui';
import type { BacktestParameters } from './backtestParameters';

export const toBacktestDefaults = (parameters: BacktestParameterInfo[]) => (
    Object.fromEntries(parameters.map(({ name, default: value }) => [name, value])) as BacktestParameters
);

/** Every forecast split, plus the training period CHAP keeps before the first. */
export const getMinimumEvaluationPeriods = (
    periodType: string | null | undefined,
    parameters: Pick<BacktestParameters, 'nPeriods' | 'nSplits' | 'stride'> | undefined,
) => {
    const key = periodType?.toUpperCase();
    if (!parameters || (key !== PERIOD_TYPES.MONTH && key !== PERIOD_TYPES.WEEK)) {
        return undefined;
    }
    const { nPeriods, nSplits, stride } = parameters;
    if (![nPeriods, nSplits, stride].every(value => Number.isInteger(value) && value > 0)) {
        return undefined;
    }
    return nPeriods + (nSplits - 1) * stride + 1;
};
