import { PERIOD_TYPES } from '@dhis2-chap/core';

const N_SPLITS = 10;

const N_PERIODS = {
    [PERIOD_TYPES.MONTH]: 3,
    [PERIOD_TYPES.WEEK]: 12,
};

const N_STRIDES = {
    [PERIOD_TYPES.MONTH]: 1,
    [PERIOD_TYPES.WEEK]: 4,
};

/** Splitting defaults for a backtest, keyed by period type (accepts the API's lowercase form too). */
export const getBacktestSplitting = (periodType: string | null | undefined) => {
    const key = periodType?.toUpperCase() as keyof typeof N_PERIODS;
    if (!N_PERIODS[key]) {
        return undefined;
    }

    return {
        nPeriods: N_PERIODS[key],
        nSplits: N_SPLITS,
        stride: N_STRIDES[key],
    };
};
