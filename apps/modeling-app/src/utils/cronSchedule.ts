const CRON_FIELD_COUNT = 5;
const CRON_FIELD_PATTERN = /^[\w*?,/\-#LW]+$/i;

const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const dayAliases: Record<string, number> = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
};

const monthAliases: Record<string, number> = {
    JAN: 1,
    FEB: 2,
    MAR: 3,
    APR: 4,
    MAY: 5,
    JUN: 6,
    JUL: 7,
    AUG: 8,
    SEP: 9,
    OCT: 10,
    NOV: 11,
    DEC: 12,
};

const isInteger = (value: string) => /^\d+$/.test(value);

const toNumber = (
    value: string,
    aliases: Record<string, number> = {},
) => {
    const normalizedValue = value.toUpperCase();

    if (normalizedValue in aliases) {
        return aliases[normalizedValue];
    }

    if (!isInteger(value)) {
        return undefined;
    }

    return Number(value);
};

const hasValidCronCharacters = (field: string) => CRON_FIELD_PATTERN.test(field);

const isWithinRange = (value: string, min: number, max: number, aliases?: Record<string, number>) => {
    const numberValue = toNumber(value, aliases);

    return numberValue !== undefined && numberValue >= min && numberValue <= max;
};

const isSimpleFieldValid = (
    field: string,
    min: number,
    max: number,
    aliases?: Record<string, number>,
    allowQuestion = false,
    allowAdvanced = false,
) => {
    if (!field || !hasValidCronCharacters(field)) {
        return false;
    }

    if (field === '*') {
        return true;
    }

    if (field === '?') {
        return allowQuestion;
    }

    if (allowAdvanced && /[LW#]/i.test(field)) {
        return true;
    }

    return field.split(',').every((part) => {
        const [rangePart, step] = part.split('/');

        if (step && !isInteger(step)) {
            return false;
        }

        if (rangePart === '*') {
            return true;
        }

        const range = rangePart.split('-');

        if (range.length === 2) {
            const [start, end] = range;

            return isWithinRange(start, min, max, aliases) &&
                isWithinRange(end, min, max, aliases);
        }

        return isWithinRange(rangePart, min, max, aliases);
    });
};

export const isValidCronExpression = (expression: string) => {
    const fields = expression.trim().split(/\s+/);

    if (fields.length !== CRON_FIELD_COUNT) {
        return false;
    }

    const [
        minutes,
        hours,
        dayOfMonth,
        month,
        dayOfWeek,
    ] = fields;

    return isSimpleFieldValid(minutes, 0, 59) &&
        isSimpleFieldValid(hours, 0, 23) &&
        isSimpleFieldValid(dayOfMonth, 1, 31, undefined, true, true) &&
        isSimpleFieldValid(month, 1, 12, monthAliases) &&
        isSimpleFieldValid(dayOfWeek, 0, 7, dayAliases, true, true);
};

export const toFiveFieldCronExpression = (expression?: string | null) => {
    if (!expression) {
        return '';
    }

    const fields = expression.trim().split(/\s+/);

    if (fields.length === 6) {
        return fields.slice(1).join(' ');
    }

    return expression.trim();
};

const formatTime = (hours: string, minutes: string) => {
    if (!isInteger(hours) || !isInteger(minutes)) {
        return undefined;
    }

    const hoursNumber = Number(hours);
    const minutesNumber = Number(minutes);

    if (
        hoursNumber < 0
        || hoursNumber > 23
        || minutesNumber < 0
        || minutesNumber > 59
    ) {
        return undefined;
    }

    const displayHour = hoursNumber % 12 || 12;
    const displayMinute = minutesNumber.toString().padStart(2, '0');
    const period = hoursNumber >= 12 ? 'PM' : 'AM';

    return `${displayHour}:${displayMinute} ${period}`;
};

const normalizeDayNumber = (day: number) => (day === 7 ? 0 : day);

const formatDayOfWeekValue = (value: string) => {
    const day = toNumber(value, dayAliases);

    if (day === undefined || day < 0 || day > 7) {
        return undefined;
    }

    return dayNames[normalizeDayNumber(day)];
};

const formatDayOfWeek = (dayOfWeek: string) => {
    if (dayOfWeek === '*' || dayOfWeek === '?') {
        return 'every day';
    }

    if (dayOfWeek.includes('/')) {
        return undefined;
    }

    const range = dayOfWeek.split('-');

    if (range.length === 2) {
        const [start, end] = range;
        const startDay = formatDayOfWeekValue(start);
        const endDay = formatDayOfWeekValue(end);

        if (!startDay || !endDay) {
            return undefined;
        }

        return `${startDay} through ${endDay}`;
    }

    const days = dayOfWeek.split(',').map(formatDayOfWeekValue);

    if (days.some(day => !day)) {
        return undefined;
    }

    return days.join(', ');
};

const formatMonthValue = (value: string) => {
    const month = toNumber(value, monthAliases);

    if (month === undefined || month < 1 || month > 12) {
        return undefined;
    }

    return monthNames[month - 1];
};

const formatMonth = (month: string) => {
    if (month === '*') {
        return undefined;
    }

    const range = month.split('-');

    if (range.length === 2) {
        const [start, end] = range;
        const startMonth = formatMonthValue(start);
        const endMonth = formatMonthValue(end);

        if (!startMonth || !endMonth) {
            return undefined;
        }

        return `${startMonth} through ${endMonth}`;
    }

    const months = month.split(',').map(formatMonthValue);

    if (months.some(monthName => !monthName)) {
        return undefined;
    }

    return months.join(', ');
};

export const getCronExpressionDescription = (expression: string) => {
    if (!isValidCronExpression(expression)) {
        return undefined;
    }

    const [
        minutes,
        hours,
        dayOfMonth,
        month,
        dayOfWeek,
    ] = expression.trim().split(/\s+/);

    const time = formatTime(hours, minutes);

    if (!time) {
        return 'Custom schedule';
    }

    const parts = [`At ${time}`];
    const formattedDayOfWeek = formatDayOfWeek(dayOfWeek);
    const formattedMonth = formatMonth(month);

    if (dayOfMonth !== '*' && dayOfMonth !== '?') {
        parts.push(`on day ${dayOfMonth} of the month`);
    } else if (formattedDayOfWeek) {
        parts.push(formattedDayOfWeek);
    }

    if (formattedMonth) {
        parts.push(`in ${formattedMonth}`);
    }

    return parts.join(', ');
};
