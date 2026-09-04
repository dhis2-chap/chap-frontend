import i18n from '@dhis2/d2-i18n';
import type {
    PercentileParams,
    SeasonalParams,
    ThresholdLineRoles,
} from '@dhis2-chap/ui';

export type SeasonalThresholdParams = SeasonalParams & {
    type: 'seasonal';
    stdMultiplier: number;
};

export type PercentileThresholdParams = PercentileParams & {
    type: 'percentile';
    quantile: [number, number];
    baselineYears: number | null;
};

export type ThresholdParams = SeasonalThresholdParams | PercentileThresholdParams;

export type ThresholdStrategyId = ThresholdParams['type'];

export const DEFAULT_THRESHOLD_STRATEGY: ThresholdStrategyId = 'seasonal';

// These defaults duplicate the backend's (chap-core assessment/thresholds/params.py)
// because GET /thresholds/strategies carries no param metadata; ask Morten about
// exposing defaultParams on the catalogue endpoint so the two cannot drift.
const DEFAULT_PARAMS: Record<ThresholdStrategyId, ThresholdParams> = {
    seasonal: {
        type: 'seasonal',
        stdMultiplier: 2,
    },
    percentile: {
        type: 'percentile',
        quantile: [0.25, 0.75],
        baselineYears: 5,
    },
};

export const isKnownThresholdStrategy = (
    id: string | undefined,
): id is ThresholdStrategyId => (
    id !== undefined && id in DEFAULT_PARAMS
);

export const getDefaultThresholdParams = (
    strategy: ThresholdStrategyId,
): ThresholdParams => {
    const defaults = DEFAULT_PARAMS[strategy];

    // Copy so callers can never mutate the shared defaults.
    return defaults.type === 'percentile'
        ? { ...defaults, quantile: [defaults.quantile[0], defaults.quantile[1]] }
        : { ...defaults };
};

export const areThresholdParamsEqual = (
    a: ThresholdParams,
    b: ThresholdParams,
): boolean => {
    if (a.type === 'seasonal' && b.type === 'seasonal') {
        return a.stdMultiplier === b.stdMultiplier;
    }

    if (a.type === 'percentile' && b.type === 'percentile') {
        return a.quantile[0] === b.quantile[0] &&
            a.quantile[1] === b.quantile[1] &&
            a.baselineYears === b.baselineYears;
    }

    return false;
};

export const getThresholdLineRoles = (
    strategy: ThresholdStrategyId,
): ThresholdLineRoles => (
    strategy === 'percentile'
        ? { upperIndex: 1, lowerIndex: 0 }
        : { upperIndex: 0 }
);

const fractionToPercentString = (fraction: number): string => {
    const percent = fraction * 100;

    // Use the shortest percentage that converts back to the same fraction.
    // This hides multiplication noise without discarding configured precision.
    for (let significantDigits = 1; significantDigits <= 17; significantDigits++) {
        const candidate = Number(percent.toPrecision(significantDigits));
        if (candidate / 100 === fraction) {
            return String(candidate);
        }
    }

    return String(percent);
};

export const describeThresholdParams = (params: ThresholdParams): string => {
    if (params.type === 'seasonal') {
        return i18n.t('{{stdMultiplier}} standard deviations above seasonal mean', {
            stdMultiplier: params.stdMultiplier,
        });
    }

    const lower = fractionToPercentString(params.quantile[0]);
    const upper = fractionToPercentString(params.quantile[1]);

    if (params.baselineYears === null) {
        return i18n.t('{{lower}}-{{upper}} percentile, all-history baseline', { lower, upper });
    }

    return i18n.t('{{lower}}-{{upper}} percentile, {{count}}-year baseline', {
        lower,
        upper,
        count: params.baselineYears,
    });
};

export type ThresholdParamsFormValues = {
    stdMultiplier: string;
    lowerPercentile: string;
    upperPercentile: string;
    baselineYears: string;
};

export type ThresholdParamsFormErrors = Partial<Record<keyof ThresholdParamsFormValues, string>>;

export type ParsedThresholdParams = {
    params?: ThresholdParams;
    errors?: ThresholdParamsFormErrors;
};

const parseNumericField = (raw: string): number | undefined => {
    const trimmed = raw.trim();
    if (trimmed === '') {
        return undefined;
    }
    const value = Number(trimmed);
    return Number.isFinite(value) ? value : undefined;
};

export const paramsToFormValues = (params: ThresholdParams): ThresholdParamsFormValues => {
    const seasonalDefaults = DEFAULT_PARAMS.seasonal as SeasonalThresholdParams;
    const percentileDefaults = DEFAULT_PARAMS.percentile as PercentileThresholdParams;
    const seasonal = params.type === 'seasonal' ? params : seasonalDefaults;
    const percentile = params.type === 'percentile' ? params : percentileDefaults;

    return {
        stdMultiplier: String(seasonal.stdMultiplier),
        lowerPercentile: fractionToPercentString(percentile.quantile[0]),
        upperPercentile: fractionToPercentString(percentile.quantile[1]),
        baselineYears: percentile.baselineYears === null ? '' : String(percentile.baselineYears),
    };
};

const parsePercentileField = (raw: string): { value?: number; error?: string } => {
    const value = parseNumericField(raw);

    if (value === undefined || value < 0 || value > 100) {
        return { error: i18n.t('Enter a percentage between 0 and 100') };
    }

    return { value };
};

export const parseThresholdParams = (
    strategy: ThresholdStrategyId,
    formValues: ThresholdParamsFormValues,
): ParsedThresholdParams => {
    if (strategy === 'seasonal') {
        const stdMultiplier = parseNumericField(formValues.stdMultiplier);

        if (stdMultiplier === undefined || stdMultiplier < 0) {
            return {
                errors: {
                    stdMultiplier: i18n.t('Enter a number of 0 or more'),
                },
            };
        }

        return {
            params: {
                type: 'seasonal',
                stdMultiplier,
            },
        };
    }

    const errors: ThresholdParamsFormErrors = {};
    const lower = parsePercentileField(formValues.lowerPercentile);
    const upper = parsePercentileField(formValues.upperPercentile);

    if (lower.error) {
        errors.lowerPercentile = lower.error;
    }
    if (upper.error) {
        errors.upperPercentile = upper.error;
    }
    if (lower.value !== undefined && upper.value !== undefined && lower.value >= upper.value) {
        errors.lowerPercentile = i18n.t('Must be lower than the upper percentile');
    }

    const baselineYearsRaw = formValues.baselineYears.trim();
    let baselineYears: number | null = null;

    if (baselineYearsRaw !== '') {
        const parsed = parseNumericField(baselineYearsRaw);

        if (parsed === undefined || !Number.isInteger(parsed) || parsed < 1) {
            errors.baselineYears = i18n.t('Enter a whole number of 1 or more, or leave empty to use all history');
        } else {
            baselineYears = parsed;
        }
    }

    if (Object.keys(errors).length > 0) {
        return { errors };
    }

    return {
        params: {
            type: 'percentile',
            quantile: [(lower.value as number) / 100, (upper.value as number) / 100],
            baselineYears,
        },
    };
};
