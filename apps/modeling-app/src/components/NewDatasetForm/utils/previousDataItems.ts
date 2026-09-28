import type { DataSetInfo } from '@dhis2-chap/ui';

/**
 * The DHIS2 data items each column name was imported from in earlier datasets, most used first
 * and the newest dataset first on a tie.
 */
export const getPreviousDataItems = (datasets: DataSetInfo[]): Map<string, string[]> => {
    const counts = new Map<string, Map<string, number>>();
    [...datasets]
        .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
        .flatMap(dataset => dataset.dataSources ?? [])
        .forEach(({ covariate, dataElementId }) => {
            const forCovariate = counts.get(covariate) ?? new Map<string, number>();
            forCovariate.set(dataElementId, (forCovariate.get(dataElementId) ?? 0) + 1);
            counts.set(covariate, forCovariate);
        });

    // Maps keep insertion order and the sort is stable, so ties keep the newest dataset's item.
    return new Map([...counts].map(([covariate, forCovariate]) => [
        covariate,
        [...forCovariate].sort((a, b) => b[1] - a[1]).map(([dataElementId]) => dataElementId),
    ]));
};
