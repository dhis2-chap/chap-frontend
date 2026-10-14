import type { AlertLevel } from '../httpfunctions';

// Alert levels describe a single threshold line, so list values hold one number.
const single = (value?: number | number[]) => (Array.isArray(value) ? value[0] : value);

const thresholdValue = (params: AlertLevel['thresholdParams']) => (
    'quantile' in params ? single(params.quantile) : single('stdMultiplier' in params ? params.stdMultiplier : undefined)
) ?? 0;

/**
 * Orders levels from least to most strict, the order the backend treats as least to most severe.
 * A higher minimum probability is stricter. On a tie, a higher threshold line is stricter when both
 * levels use the same strategy. Lines from different strategies are not comparable, so tied levels are
 * grouped by strategy in the order each strategy was first entered, keeping the comparison transitive.
 */
export const sortAlertLevels = (levels: AlertLevel[]) => {
    const strategyRank = (level: AlertLevel) => (
        levels.findIndex(other => other.thresholdParams.type === level.thresholdParams.type)
    );
    return [...levels].sort((a, b) => (
        a.exceedanceThreshold - b.exceedanceThreshold
        || strategyRank(a) - strategyRank(b)
        || thresholdValue(a.thresholdParams) - thresholdValue(b.thresholdParams)
    ));
};
