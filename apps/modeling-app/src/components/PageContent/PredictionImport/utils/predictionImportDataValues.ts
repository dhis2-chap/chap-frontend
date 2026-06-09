import {
    DEFAULT_DHIS2_CALENDAR,
    DEFAULT_DHIS2_LOCALE,
    createFixedPeriodFromPeriodId,
    getFixedPeriodByDate,
    getLastNPeriodIds,
    getNextPeriodIds,
    getPeriodsInRange,
    sortPeriodIds,
    toDhis2FixedPeriodType,
} from '@dhis2-chap/core';
import type { Dhis2Calendar, Dhis2FixedPeriodType } from '@dhis2-chap/core';
import type {
    OutbreakIndicator,
    PredictionEntry,
    QuantileKey,
} from '@dhis2-chap/ui';

export const STANDARD_QUANTILES = [0.1, 0.25, 0.5, 0.75, 0.9];

const CLEAR_WINDOW_PERIODS_BY_TYPE = {
    MONTHLY: 12,
    WEEKLY: 52,
} as const;

const CLEAR_PERIOD_TYPES = ['MONTHLY', 'WEEKLY'] as const satisfies Dhis2FixedPeriodType[];

const QUANTILE_STRINGS = {
    QUANTILE_LOW: 'quantile_low',
    MEDIAN: 'median',
    QUANTILE_HIGH: 'quantile_high',
    QUANTILE_MID_LOW: 'quantile_mid_low',
    QUANTILE_MID_HIGH: 'quantile_mid_high',
} as const;

const QUANTILE_MAP: Record<number, QuantileKey> = {
    0.1: QUANTILE_STRINGS.QUANTILE_LOW,
    0.25: QUANTILE_STRINGS.QUANTILE_MID_LOW,
    0.5: QUANTILE_STRINGS.MEDIAN,
    0.75: QUANTILE_STRINGS.QUANTILE_MID_HIGH,
    0.9: QUANTILE_STRINGS.QUANTILE_HIGH,
};

export type QuantileMapping = {
    quantileLowId: string;
    quantileMedianId: string;
    quantileHighId: string;
    quantileMidLowId: string;
    quantileMidHighId: string;
    outbreakIndicatorId: string;
};

export type PredictionDataValue = {
    dataElement: string;
    period: string;
    orgUnit: string;
    value: string;
};

export type PredictionClearDataValue = {
    dataElement: string;
    period: string;
    orgUnit: string;
};

type BuildClearPeriodIdsOptions = {
    forecastPeriodIds: string[];
    periodType: string | null | undefined;
    calendar?: Dhis2Calendar;
    locale?: string;
};

type BuildClearDataValuesOptions = BuildClearPeriodIdsOptions & {
    dataElementIds: string[];
    orgUnitIds: string[];
};

const mapQuantileToKey = (quantile: number): QuantileKey | null => QUANTILE_MAP[quantile] ?? null;

const mapQuantileKeyToDataElement = (
    quantileKey: QuantileKey,
    quantileMapping: QuantileMapping,
): string => {
    switch (quantileKey) {
        case QUANTILE_STRINGS.QUANTILE_LOW:
            return quantileMapping.quantileLowId;
        case QUANTILE_STRINGS.MEDIAN:
            return quantileMapping.quantileMedianId;
        case QUANTILE_STRINGS.QUANTILE_HIGH:
            return quantileMapping.quantileHighId;
        case QUANTILE_STRINGS.QUANTILE_MID_LOW:
            return quantileMapping.quantileMidLowId;
        case QUANTILE_STRINGS.QUANTILE_MID_HIGH:
            return quantileMapping.quantileMidHighId;
        default:
            throw new Error(`Unknown quantile key: ${quantileKey}`);
    }
};

export const deduplicateIds = (ids: string[]): string[] => (
    Array.from(new Set(ids.filter(Boolean)))
);

export const getSelectedOutputDataElementIds = (
    quantileMapping: QuantileMapping,
): string[] => (
    deduplicateIds([
        quantileMapping.quantileHighId,
        quantileMapping.quantileMidHighId,
        quantileMapping.quantileMedianId,
        quantileMapping.quantileMidLowId,
        quantileMapping.quantileLowId,
        quantileMapping.outbreakIndicatorId,
    ])
);

export const transformPredictionEntriesToDataValues = (
    predictionEntries: PredictionEntry[],
    quantileMapping: QuantileMapping,
): PredictionDataValue[] => (
    predictionEntries
        .map((entry) => {
            const quantileKey = mapQuantileToKey(entry.quantile);
            if (!quantileKey) {
                return null;
            }

            return {
                dataElement: mapQuantileKeyToDataElement(quantileKey, quantileMapping),
                period: entry.period,
                orgUnit: entry.orgUnit,
                value: entry.value.toString(),
            };
        })
        .filter((value): value is PredictionDataValue => value !== null)
);

export const transformOutbreakIndicatorsToDataValues = (
    outbreakIndicators: OutbreakIndicator[],
    outbreakIndicatorId: string,
): PredictionDataValue[] => {
    if (!outbreakIndicatorId) {
        return [];
    }

    return outbreakIndicators.map(indicator => ({
        dataElement: outbreakIndicatorId,
        period: indicator.period,
        orgUnit: indicator.orgUnitId,
        value: indicator.value,
    }));
};

export const buildClearPeriodIds = ({
    forecastPeriodIds,
    periodType,
    calendar = DEFAULT_DHIS2_CALENDAR,
    locale = DEFAULT_DHIS2_LOCALE,
}: BuildClearPeriodIdsOptions): string[] => {
    const periodEngineOptions = { calendar, locale };
    const sortedForecastPeriods = sortPeriodIds(deduplicateIds(forecastPeriodIds), periodEngineOptions);
    const firstForecastPeriod = sortedForecastPeriods[0];
    const lastForecastPeriod = sortedForecastPeriods[sortedForecastPeriods.length - 1];

    if (!firstForecastPeriod || !lastForecastPeriod) {
        return [];
    }

    const dhis2PeriodType = toDhis2FixedPeriodType(periodType);

    if (dhis2PeriodType !== 'MONTHLY' && dhis2PeriodType !== 'WEEKLY') {
        throw new Error(`Unsupported prediction period type "${periodType ?? ''}"`);
    }

    const periodCount = CLEAR_WINDOW_PERIODS_BY_TYPE[dhis2PeriodType];
    const startPeriodId = getLastNPeriodIds({
        periodId: firstForecastPeriod,
        count: periodCount + 1,
        ...periodEngineOptions,
    })[0] ?? firstForecastPeriod;
    const endPeriodId = getNextPeriodIds({
        periodId: lastForecastPeriod,
        count: periodCount,
        ...periodEngineOptions,
    }).at(-1) ?? lastForecastPeriod;
    const startPeriod = createFixedPeriodFromPeriodId({
        periodId: startPeriodId,
        ...periodEngineOptions,
    });
    const endPeriod = createFixedPeriodFromPeriodId({
        periodId: endPeriodId,
        ...periodEngineOptions,
    });
    const clearPeriodIds = CLEAR_PERIOD_TYPES.flatMap((clearPeriodType) => {
        const clearStartPeriod = getFixedPeriodByDate({
            periodType: clearPeriodType,
            date: startPeriod.startDate,
            ...periodEngineOptions,
        });
        const clearEndPeriod = getFixedPeriodByDate({
            periodType: clearPeriodType,
            date: endPeriod.endDate,
            ...periodEngineOptions,
        });

        return getPeriodsInRange({
            startPeriodId: clearStartPeriod.id,
            endPeriodId: clearEndPeriod.id,
            ...periodEngineOptions,
        }).map(period => period.id);
    });

    return sortPeriodIds(deduplicateIds(clearPeriodIds), periodEngineOptions);
};

export const buildClearDataValues = ({
    dataElementIds,
    orgUnitIds,
    forecastPeriodIds,
    periodType,
    calendar,
    locale,
}: BuildClearDataValuesOptions): PredictionClearDataValue[] => {
    const clearPeriodIds = buildClearPeriodIds({
        forecastPeriodIds,
        periodType,
        calendar,
        locale,
    });
    const selectedDataElementIds = deduplicateIds(dataElementIds);
    const selectedOrgUnitIds = deduplicateIds(orgUnitIds);

    return selectedDataElementIds.flatMap(dataElement => (
        selectedOrgUnitIds.flatMap(orgUnit => (
            clearPeriodIds.map(period => ({
                dataElement,
                period,
                orgUnit,
            }))
        ))
    ));
};
