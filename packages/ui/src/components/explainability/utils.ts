export const formatFeatureName = (name: string): string =>
    name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const CHART_COLORS = {
    positive: '#c62828',
    positiveLight: '#ef9a9a',
    negative: '#1565c0',
    negativeLight: '#90caf9',
    neutral: '#1976d2',
    baseline: '#607d8b',
    sum: '#455a64',
} as const;
