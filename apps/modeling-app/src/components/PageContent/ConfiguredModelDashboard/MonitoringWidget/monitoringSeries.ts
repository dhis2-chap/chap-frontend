import { createFixedPeriodFromPeriodId, DEFAULT_DHIS2_CALENDAR } from '@dhis2-chap/core';
import type { PredictionSetupMonitoring } from '@dhis2-chap/ui';

type Point = PredictionSetupMonitoring['points'][number];

const toChartPoints = (points: Point[]) => points
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
        evaluationRunning: splits.map(point => ({ x: point.x, name: point.period, y: point.runningValue })),
        // Starts at the last split so the score visibly continues where the evaluation's running aggregate ends
        evaluation: predictions.length
            ? [...splits.slice(-1), ...predictions].map(point => ({ x: point.x, name: point.period, y: monitoring.evaluationValue }))
            : [],
        perRun: predictions.map(point => ({ x: point.x, name: point.period, y: point.value })),
        running: predictions.map(point => ({ x: point.x, name: point.period, y: point.runningValue })),
    };
};
