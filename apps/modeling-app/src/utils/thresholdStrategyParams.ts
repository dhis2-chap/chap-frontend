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

// UI presets are maintained here because the strategy catalogue has no parameter
// metadata. Percentile intentionally requests a 25th–75th band, while the backend
// default produces only the 75th-percentile line.
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

// Compile-time exhaustiveness: adding a strategy to ThresholdParams makes
// every dispatch that forgot to handle it fail to build instead of silently
// falling through to another strategy's branch.
const assertUnhandledStrategy = (strategy: never): never => {
    throw new Error(`Unhandled threshold strategy: ${JSON.stringify(strategy)}`);
};

export const getThresholdLineRoles = (
    responseParams: SeasonalParams | PercentileParams,
): ThresholdLineRoles => {
    // The response echoes the resolved params, and their line parameter list
    // states the ordering of each entry's values — so derive the roles from
    // that list rather than trusting the request params or the type label.
    const lineParameter = 'quantile' in responseParams && responseParams.quantile !== undefined
        ? responseParams.quantile
        : 'stdMultiplier' in responseParams
            ? responseParams.stdMultiplier
            : undefined;

    if (!Array.isArray(lineParameter) || lineParameter.length < 2) {
        return { upperIndex: 0 };
    }

    let lowerIndex = 0;
    let upperIndex = 0;
    lineParameter.forEach((value, index) => {
        if (value < lineParameter[lowerIndex]) {
            lowerIndex = index;
        }
        if (value > lineParameter[upperIndex]) {
            upperIndex = index;
        }
    });

    return lowerIndex === upperIndex
        ? { upperIndex }
        : { lowerIndex, upperIndex };
};

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
    switch (params.type) {
        case 'seasonal':
            return i18n.t('{{stdMultiplier}} standard deviations above seasonal mean', {
                stdMultiplier: params.stdMultiplier,
            });
        case 'percentile': {
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
        }
        default:
            return assertUnhandledStrategy(params);
    }
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

const parseSeasonalFormValues = (formValues: ThresholdParamsFormValues): ParsedThresholdParams => {
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
};

const parsePercentileFormValues = (formValues: ThresholdParamsFormValues): ParsedThresholdParams => {
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

export const parseThresholdParams = (
    strategy: ThresholdStrategyId,
    formValues: ThresholdParamsFormValues,
): ParsedThresholdParams => {
    switch (strategy) {
        case 'seasonal':
            return parseSeasonalFormValues(formValues);
        case 'percentile':
            return parsePercentileFormValues(formValues);
        default:
            return assertUnhandledStrategy(strategy);
    }
};
