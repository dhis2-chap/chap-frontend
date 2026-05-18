import {
    addMonths,
    addWeeks,
    format,
    getISOWeek,
    getISOWeekYear,
    isValid,
    parse,
    startOfISOWeek,
} from 'date-fns';
import type { PredictionInfo } from '@dhis2-chap/ui';

const PERIOD_TYPES = {
    MONTH: 'MONTH',
    WEEK: 'WEEK',
} as const;

const PREDICTION_PERIOD_METADATA_KEYS = [
    'predictionPeriods',
    'predictedPeriods',
];

const getStringArray = (value: unknown): string[] | undefined => (
    Array.isArray(value) && value.every(item => typeof item === 'string')
        ? value
        : undefined
);

const getStringValue = (value: unknown): string | undefined => (
    typeof value === 'string' && value.length > 0 ? value : undefined
);

const normalizePeriodType = (periodType?: string | null) => {
    const normalized = periodType?.toUpperCase();

    if (normalized === PERIOD_TYPES.MONTH || normalized === PERIOD_TYPES.WEEK) {
        return normalized;
    }

    return undefined;
};

const getMetadataPredictionPeriods = (metaData?: Record<string, unknown>) => {
    if (!metaData) {
        return undefined;
    }

    for (const key of PREDICTION_PERIOD_METADATA_KEYS) {
        const periods = getStringArray(metaData[key]);
        if (periods?.length) {
            return periods;
        }
    }

    return undefined;
};

const getMetadataTrainingDataToDate = (metaData?: Record<string, unknown>) => {
    if (!metaData) {
        return undefined;
    }

    const trainingData = metaData.trainingData;
    const isTrainingDataObject = !!trainingData && typeof trainingData === 'object' && !Array.isArray(trainingData);
    const nestedTrainingToDate = isTrainingDataObject
        ? getStringValue((trainingData as Record<string, unknown>).toDate)
        : undefined;

    return nestedTrainingToDate
        || getStringValue(metaData.trainingDataToDate)
        || getStringValue(metaData.toDate);
};

export const getNextPeriods = (
    lastPeriod: string | undefined | null,
    periodType: string | undefined | null,
    count: number | undefined | null,
) => {
    if (!lastPeriod || !count || count <= 0) {
        return [];
    }

    const normalizedPeriodType = normalizePeriodType(periodType);

    if (normalizedPeriodType === PERIOD_TYPES.MONTH) {
        const lastPeriodDate = parse(lastPeriod, 'yyyyMM', new Date());

        if (!isValid(lastPeriodDate)) {
            return [];
        }

        return Array.from({ length: count }, (_, index) => (
            format(addMonths(lastPeriodDate, index + 1), 'yyyyMM')
        ));
    }

    if (normalizedPeriodType === PERIOD_TYPES.WEEK) {
        const weekMatch = lastPeriod.match(/^(\d{4})W(\d{1,2})$/);

        if (!weekMatch) {
            return [];
        }

        const [, year, week] = weekMatch;
        const lastPeriodDate = parse(
            `${year}-W${week.padStart(2, '0')}`,
            'RRRR-\'W\'II',
            new Date(),
        );

        if (!isValid(lastPeriodDate)) {
            return [];
        }

        const padWeek = week.length > 1;
        const startDate = addWeeks(startOfISOWeek(lastPeriodDate), 1);

        return Array.from({ length: count }, (_, index) => {
            const date = addWeeks(startDate, index);
            const weekNumber = String(getISOWeek(date));
            return `${getISOWeekYear(date)}W${padWeek ? weekNumber.padStart(2, '0') : weekNumber}`;
        });
    }

    return [];
};

export const getPredictionPeriodIds = (prediction: PredictionInfo) => (
    getMetadataPredictionPeriods(prediction.metaData)
    || getNextPeriods(
        prediction.dataset?.lastPeriod,
        prediction.dataset?.periodType,
        prediction.nPeriods,
    )
);

export const getTrainingDataToDate = (prediction: PredictionInfo) => (
    getMetadataTrainingDataToDate(prediction.metaData)
    || prediction.dataset?.lastPeriod
);

export const formatPeriodId = (periodId: string | undefined | null) => {
    if (!periodId) {
        return undefined;
    }

    const monthDate = parse(periodId, 'yyyyMM', new Date());

    if (/^\d{6}$/.test(periodId) && isValid(monthDate)) {
        return format(monthDate, 'MMMM yyyy');
    }

    const weekMatch = periodId.match(/^(\d{4})W(\d{1,2})$/);

    if (weekMatch) {
        const [, year, week] = weekMatch;
        const weekDate = parse(
            `${year}-W${week.padStart(2, '0')}`,
            'RRRR-\'W\'II',
            new Date(),
        );

        if (isValid(weekDate)) {
            return `Week ${Number(week)}, ${year}`;
        }
    }

    return periodId;
};

export const buildPredictionRunMetaData = ({
    nPeriods,
    periodType,
    trainingPeriods,
}: {
    nPeriods: number;
    periodType: string;
    trainingPeriods: string[];
}) => {
    const trainingDataToDate = trainingPeriods[trainingPeriods.length - 1];

    return {
        trainingData: {
            fromDate: trainingPeriods[0],
            toDate: trainingDataToDate,
            periods: trainingPeriods,
        },
        trainingDataToDate,
        predictionPeriods: getNextPeriods(trainingDataToDate, periodType, nPeriods),
    };
};
