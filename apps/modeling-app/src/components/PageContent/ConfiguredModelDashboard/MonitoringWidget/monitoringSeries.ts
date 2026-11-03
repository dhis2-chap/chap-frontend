import { createFixedPeriodFromPeriodId, DEFAULT_DHIS2_CALENDAR } from '@dhis2-chap/core';
import type { MonitoringPoint, PredictionSetupMonitoring } from '@dhis2-chap/ui';

const toChartPoints = (points: MonitoringPoint[]) => points
    .map(point => ({
        ...point,
        x: Date.parse(createFixedPeriodFromPeriodId({
            periodId: point.period.replace(/-/g, ''),
            calendar: DEFAULT_DHIS2_CALENDAR,
        }).startDate),
    }))
    .sort((a, b) => a.x - b.x);

export const monitoringSeries = (monitoring: PredictionSetupMonitoring) => {
    const predictions = toChartPoints(monitoring.points.filter(point => point.source === 'prediction'));
    const splits = toChartPoints(monitoring.points.filter(point => point.source === 'evaluation'));

    return {
        evaluationPerSplit: splits.map(point => ({ x: point.x, name: point.period, y: point.value })),
        // Starts at the last split so the evaluation average reaches across the prediction runs
        evaluation: predictions.length && monitoring.evaluationValue != null
            ? [...splits.slice(-1), ...predictions].map(point => ({ x: point.x, name: point.period, y: monitoring.evaluationValue }))
            : [],
        perRun: predictions.map(point => ({ x: point.x, name: point.period, y: point.value })),
    };
};
