import i18n from '@dhis2/d2-i18n';

// Intl.DateTimeFormat construction is expensive and these labels are
// rendered per axis tick, so keep one formatter per locale and format.
const monthYearFormatters = new Map<string, Intl.DateTimeFormat>();

const getMonthYearFormatter = (monthFormat: 'long' | 'short') => {
    const locale = i18n.language;
    const key = `${locale}:${monthFormat}`;
    const cached = monthYearFormatters.get(key);

    if (cached) {
        return cached;
    }

    const formatter = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: monthFormat,
        timeZone: 'UTC',
    });
    monthYearFormatters.set(key, formatter);

    return formatter;
};

export const getPeriodNameFromId = (
    periodId: string | undefined,
    monthFormat: 'long' | 'short' = 'long',
) => {
    // this should be moved to utils probably
    // or actually just use import { getPeriodNameFromId } from '@dhis2/multi-period-dimension'
    // console.log('periodId', periodId)
    if (!periodId) return 'NA';
    if (periodId.length == 4) {
        return periodId;
    }
    if (periodId.includes('W')) {
        const match = periodId.match(/(\d{4})W(\d{1,2})/);
        if (!match || match.length < 3) {
            return periodId;
        }
        const [year, week] = match.slice(1, 3);
        return `Week ${week.replace(/ˆ0/, '')} ${year}`;
    }
    if (periodId.length == 6) {
        const year = Number(periodId.slice(0, 4));
        const month = Number(periodId.slice(4, 6));

        if (!Number.isInteger(month) || month < 1 || month > 12) {
            return periodId;
        }

        return getMonthYearFormatter(monthFormat).format(Date.UTC(year, month - 1, 1));
    }

    return periodId;
};
