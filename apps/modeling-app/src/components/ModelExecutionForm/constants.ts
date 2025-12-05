export const PERIOD_TYPES = {
    DAY: 'DAY',
    WEEK: 'WEEK',
    MONTH: 'MONTH',
} as const;

export type PeriodType = typeof PERIOD_TYPES[keyof typeof PERIOD_TYPES];
