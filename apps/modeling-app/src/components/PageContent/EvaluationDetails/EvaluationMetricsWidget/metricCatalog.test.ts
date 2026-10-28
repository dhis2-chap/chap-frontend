import { describe, expect, it } from 'vitest';
import type { MetricInfo } from '@dhis2-chap/ui';
import { getDefaultMetricIds, sortMetricIds } from './metricCatalog';

const catalog = [
    { id: 'rmse', displayName: 'RMSE', sortOrder: 1, isSelected: false },
    { id: 'mape', displayName: 'MAPE', sortOrder: 0, isSelected: true },
] as MetricInfo[];

describe('metric defaults', () => {
    it('orders metrics by the configured order, then headline order, then name', () => {
        expect(sortMetricIds(['zeta', 'crps_log1p', 'rmse', 'alpha', 'mape'], catalog)).toEqual(['mape', 'rmse', 'crps_log1p', 'alpha', 'zeta']);
        expect(sortMetricIds(['rmse', 'mae', 'crps_log1p'])).toEqual(['crps_log1p', 'mae', 'rmse']);
    });

    it('shows the selected metrics by default and falls back to the headline metrics', () => {
        expect(getDefaultMetricIds(['rmse', 'mape', 'mae'], catalog)).toEqual(['mape']);
        expect(getDefaultMetricIds(['rmse', 'zeta', 'mae'])).toEqual(['rmse', 'mae']);
    });
});
