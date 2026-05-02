export const getChartHeight = (
    importanceFeatureCount: number,
    beeswarmFeatureCount: number,
    supportsBeeswarm: boolean,
): number =>
    Math.max(
        Math.max(200, importanceFeatureCount * 35 + 80),
        supportsBeeswarm ? Math.max(300, beeswarmFeatureCount * 50 + 120) : 0,
    );
