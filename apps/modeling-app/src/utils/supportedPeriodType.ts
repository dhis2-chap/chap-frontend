export const SUPPORTED_PERIOD_TYPES = {
    MONTH: 'MONTH',
    WEEK: 'WEEK',
} as const;

export type SupportedPeriodType = typeof SUPPORTED_PERIOD_TYPES[keyof typeof SUPPORTED_PERIOD_TYPES];

export const isSupportedPeriodType = (value: unknown): value is SupportedPeriodType => (
    value === SUPPORTED_PERIOD_TYPES.WEEK || value === SUPPORTED_PERIOD_TYPES.MONTH
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
