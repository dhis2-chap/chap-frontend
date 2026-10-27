import { describe, expect, it } from 'vitest';
import type { AlertLevel } from '@dhis2-chap/ui';
import { sortAlertLevels } from './sortAlertLevels';

const seasonal = (name: string, stdMultiplier: number, exceedanceThreshold: number): AlertLevel => ({
    name,
    outputCode: name,
    exceedanceThreshold,
    thresholdParams: { type: 'seasonal', stdMultiplier },
});

const percentile = (name: string, quantile: number, exceedanceThreshold: number): AlertLevel => ({
    name,
    outputCode: name,
    exceedanceThreshold,
    thresholdParams: { type: 'percentile', quantile, baselineYears: null },
});

const names = (levels: AlertLevel[]) => levels.map(level => level.name);

describe('sortAlertLevels', () => {
    it('puts a lower minimum probability before a higher one', () => {
        const levels = [seasonal('Action', 2, 0.9), seasonal('Monitor', 2, 0.75)];
        expect(names(sortAlertLevels(levels))).toEqual(['Monitor', 'Action']);
    });

    it('breaks probability ties by threshold line within a strategy', () => {
        const levels = [percentile('High', 0.9, 0.5), percentile('Low', 0.75, 0.5)];
        expect(names(sortAlertLevels(levels))).toEqual(['Low', 'High']);
    });

    it('keeps entry order for tied levels from different strategies', () => {
        const levels = [percentile('First', 0.9, 0.5), seasonal('Second', 1, 0.5)];
        expect(names(sortAlertLevels(levels))).toEqual(['First', 'Second']);
    });

    it('orders same-strategy levels separated by another strategy', () => {
        const levels = [seasonal('Action', 3, 0.75), percentile('Watch', 0.9, 0.75), seasonal('Monitor', 1, 0.75)];
        expect(names(sortAlertLevels(levels))).toEqual(['Monitor', 'Action', 'Watch']);
    });

    it('does not mutate the input', () => {
        const levels = [seasonal('Action', 2, 0.9), seasonal('Monitor', 2, 0.75)];
        sortAlertLevels(levels);
        expect(names(levels)).toEqual(['Action', 'Monitor']);
    });
});
