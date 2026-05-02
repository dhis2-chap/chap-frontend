export const formatFeatureName = (name: string): string =>
    name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const CHART_COLORS = {
    positive: '#c62828',
    positiveLight: '#ef9a9a',
    negative: '#1565c0',
    negativeLight: '#90caf9',
    neutral: '#1976d2',
    baseline: '#607d8b',
    sum: '#455a64',
    highlight: '#000',
    gridLine: '#bbb',
    baselineLine: '#90A4AE',
    forecastLine: '#e65100',
    dataLabel: '#444',
    waterfallBorder: '#e0e0e0',
    waterfallGrid: '#f0f0f0',
    qualityGood: '#4caf50',
    qualityModerate: '#ff9800',
    qualityPoor: '#f44336',
} as const;
