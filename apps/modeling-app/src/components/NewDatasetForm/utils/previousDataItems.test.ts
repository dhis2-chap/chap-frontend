import { describe, expect, it } from 'vitest';
import { getPreviousDataItems } from './previousDataItems';

const dataset = (id: number, dataSources: [string, string][]) => ({
    id,
    name: `Dataset ${id}`,
    dataSources: dataSources.map(([covariate, dataElementId]) => ({ covariate, dataElementId })),
});

describe('getPreviousDataItems', () => {
    it('lists the data items used per column, most used first and the newest on a tie', () => {
        const items = getPreviousDataItems([
            dataset(1, [['disease_cases', 'old'], ['rainfall', 'rain']]),
            dataset(2, [['disease_cases', 'old']]),
            dataset(3, [['disease_cases', 'new'], ['population', 'pop-a']]),
            dataset(4, [['population', 'pop-b']]),
            { id: 5, name: 'No sources', dataSources: null },
        ]);

        expect(Object.fromEntries(items)).toEqual({
            disease_cases: ['old', 'new'],
            rainfall: ['rain'],
            population: ['pop-b', 'pop-a'],
        });
    });
});
