import {
    mapForecastDataValues,
    DEFAULT_DHIS2_CALENDAR,
    DEFAULT_DHIS2_LOCALE,
    getLastNPeriodIds,
    getNextPeriodIds,
    getPeriodsInRange,
    sortPeriodIds,
    toDhis2FixedPeriodType,
} from '@dhis2-chap/core';
import type { Dhis2Calendar } from '@dhis2-chap/core';
import type {
    EndemicThresholdPoint,
    OutbreakIndicator,
    PredictionEntry,
} from '@dhis2-chap/ui';

export const STANDARD_QUANTILES = [0.1, 0.25, 0.5, 0.75, 0.9];

const CLEAR_WINDOW_PERIODS_BY_TYPE = {
    MONTHLY: 12,
    WEEKLY: 52,
} as const;

export type QuantileMapping = {
    quantileLowId: string;
    quantileMedianId: string;
    quantileHighId: string;
    quantileMidLowId: string;
    quantileMidHighId: string;
    outbreakIndicatorId: string;
    endemicThresholdId: string;
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
    endemicThresholdId?: string;
    endemicThresholdPeriodIds?: string[];
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
        quantileMapping.endemicThresholdId,
    ])
);

export const transformPredictionEntriesToDataValues = (
    predictionEntries: PredictionEntry[],
    quantileMapping: QuantileMapping,
): PredictionDataValue[] => (
    mapForecastDataValues(predictionEntries, [
        { quantile: 'quantile_low', dataElementId: quantileMapping.quantileLowId },
        { quantile: 'quantile_mid_low', dataElementId: quantileMapping.quantileMidLowId },
        { quantile: 'median', dataElementId: quantileMapping.quantileMedianId },
        { quantile: 'quantile_mid_high', dataElementId: quantileMapping.quantileMidHighId },
        { quantile: 'quantile_high', dataElementId: quantileMapping.quantileHighId },
    ])
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

export const transformEndemicThresholdsToDataValues = (
    thresholdMap: Map<string, EndemicThresholdPoint[]> | undefined,
    endemicThresholdId: string,
): PredictionDataValue[] => {
    if (!endemicThresholdId || !thresholdMap) {
        return [];
    }

    return Array.from(thresholdMap.entries()).flatMap(([orgUnit, points]) => (
        points
            .filter(point => point.value !== null)
            .map(point => ({
                dataElement: endemicThresholdId,
                period: point.period,
                orgUnit,
                value: String(point.value),
            }))
    ));
};

export const getEndemicThresholdPeriodIds = (
    thresholdMap: Map<string, EndemicThresholdPoint[]> | undefined,
): string[] => {
    if (!thresholdMap) {
        return [];
    }

    return deduplicateIds(
        Array.from(thresholdMap.values()).flatMap(points => points.map(point => point.period)),
    );
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
    return getPeriodsInRange({
        startPeriodId,
        endPeriodId,
        ...periodEngineOptions,
    }).map(period => period.id);
};

export const buildClearDataValues = ({
    dataElementIds,
    orgUnitIds,
    forecastPeriodIds,
    endemicThresholdId,
    endemicThresholdPeriodIds,
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
    // The endemic threshold is imported for the plotted historical periods as
    // well, so its clear window must span those in addition to the forecast.
    const thresholdClearPeriodIds = endemicThresholdId && endemicThresholdPeriodIds?.length
        ? buildClearPeriodIds({
                forecastPeriodIds: [...forecastPeriodIds, ...endemicThresholdPeriodIds],
                periodType,
                calendar,
                locale,
            })
        : clearPeriodIds;
    const selectedDataElementIds = deduplicateIds(dataElementIds);
    const selectedOrgUnitIds = deduplicateIds(orgUnitIds);

    return selectedDataElementIds.flatMap((dataElement) => {
        const periodIds = dataElement === endemicThresholdId
            ? thresholdClearPeriodIds
            : clearPeriodIds;

        return selectedOrgUnitIds.flatMap(orgUnit => (
            periodIds.map(period => ({
                dataElement,
                period,
                orgUnit,
            }))
        ));
    });
};
