import { PERIOD_TYPES } from '@dhis2-chap/ui';

export type SupportedPeriodType = typeof PERIOD_TYPES.MONTH | typeof PERIOD_TYPES.WEEK;

export const isSupportedPeriodType = (value: unknown): value is SupportedPeriodType => (
    value === PERIOD_TYPES.WEEK || value === PERIOD_TYPES.MONTH
);

export const parseSupportedPeriodType = (
    value: unknown,
): SupportedPeriodType | undefined => {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.toUpperCase();
    return isSupportedPeriodType(normalized) ? normalized : undefined;
};
