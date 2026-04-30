import { parse, addMonths, addWeeks, format, isValid, getISOWeekYear, getISOWeek } from 'date-fns';
import { convertServerToClientPeriod, PERIOD_TYPES } from '@dhis2-chap/ui';

export const getPeriodLabel = (period: string, periodType: string | null | undefined): string => {
    if (!periodType) return period;
    const [base, stepPart] = period.split('_');
    const step = stepPart ? Number(stepPart) : undefined;
    if (!step || Number.isNaN(step)) {
        try {
            return convertServerToClientPeriod(base, periodType as keyof typeof PERIOD_TYPES);
        } catch { return base; }
    }
    try {
        const upperType = periodType.toUpperCase();
        if (upperType === PERIOD_TYPES.MONTH) {
            const baseDate = parse(base, 'yyyyMM', new Date());
            if (!isValid(baseDate)) return base;
            const advanced = addMonths(baseDate, step);
            return format(advanced, 'yyyy-MM');
        }
        if (upperType === PERIOD_TYPES.WEEK) {
            const baseDate = parse(base, 'RRRRWII', new Date());
            if (!isValid(baseDate)) return base;
            const advanced = addWeeks(baseDate, step);
            const isoYear = getISOWeekYear(advanced);
            const weekNum = getISOWeek(advanced);
            return `${isoYear}-W${String(weekNum).padStart(2, '0')}`;
        }
        return convertServerToClientPeriod(base, periodType as keyof typeof PERIOD_TYPES);
    } catch { return base; }
};
