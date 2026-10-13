import type { AlertLevel } from '@dhis2-chap/ui';
import { single } from './describeAlertLevel';

const thresholdValue = (params: AlertLevel['thresholdParams']) => (
    'quantile' in params ? single(params.quantile) : single('stdMultiplier' in params ? params.stdMultiplier : undefined)
) ?? 0;

/**
 * Orders levels from least to most strict, the order the backend treats as least to most severe.
 * A higher minimum probability is stricter. On a tie, a higher threshold line is stricter when both
 * levels use the same strategy; lines from different strategies are not comparable and keep their order.
 */
export const sortAlertLevels = (levels: AlertLevel[]) => [...levels].sort((a, b) => {
    if (a.exceedanceThreshold !== b.exceedanceThreshold) {
        return a.exceedanceThreshold - b.exceedanceThreshold;
    }
    if (a.thresholdParams.type !== b.thresholdParams.type) return 0;
    return thresholdValue(a.thresholdParams) - thresholdValue(b.thresholdParams);
});
