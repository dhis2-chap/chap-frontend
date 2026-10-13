import { canonicalizePeriodId } from './periodEngine';

export const toDhis2ForecastPeriod = (period: string) => canonicalizePeriodId(period.replace(/^(\d{4})-(?=\d{2}$|W)/, '$1'));

/** Names used by prediction setup mappings in the Modeling App. */
export const FORECAST_QUANTILE_KEYS: Record<number, string> = {
    0.1: 'quantile_low',
    0.25: 'quantile_mid_low',
    0.5: 'median',
    0.75: 'quantile_mid_high',
    0.9: 'quantile_high',
};

export type ForecastDataValue = {
    dataElement: string;
    period: string;
    orgUnit: string;
    value: string;
};

export const mapForecastDataValues = (
    entries: { quantile: number; orgUnit: string; period: string; value: number }[],
    targets: { quantile: string; dataElementId: string }[],
): ForecastDataValue[] => entries.flatMap((entry) => {
    const key = FORECAST_QUANTILE_KEYS[entry.quantile];
    const dataElement = targets.find(target => target.quantile === key
        || target.quantile === String(entry.quantile))?.dataElementId;
    if (!dataElement || !Number.isFinite(entry.value)) return [];
    return [{ dataElement, period: toDhis2ForecastPeriod(entry.period), orgUnit: entry.orgUnit, value: String(entry.value) }];
});
