import { PERIOD_TYPES } from '@dhis2-chap/core';
import type { BacktestParameters } from './backtestParameters';

// Keep in sync with CHAP Core's BacktestParams and DEFAULT_WEATHER_PROVIDER_ID.
export const DEFAULT_BACKTEST_PARAMETERS: BacktestParameters = {
    nPeriods: 3,
    nSplits: 7,
    stride: 1,
    nRetrain: 1,
    futureWeatherProvider: 'climatology',
};

/** Every forecast split, plus the training period CHAP keeps before the first. */
export const getMinimumEvaluationPeriods = (
    periodType: string | null | undefined,
    parameters = DEFAULT_BACKTEST_PARAMETERS,
) => {
    const key = periodType?.toUpperCase();
    if (key !== PERIOD_TYPES.MONTH && key !== PERIOD_TYPES.WEEK) {
        return undefined;
    }
    const { nPeriods, nSplits, stride } = parameters;
    if (![nPeriods, nSplits, stride].every(value => Number.isInteger(value) && value > 0)) {
        return undefined;
    }
    return nPeriods + (nSplits - 1) * stride + 1;
};
