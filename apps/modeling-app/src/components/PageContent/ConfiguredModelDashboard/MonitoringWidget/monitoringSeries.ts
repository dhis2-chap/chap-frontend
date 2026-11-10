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

// nObserved shows how much a run's score can be trusted: few scored forecasts make it noisy.
const toRunPoint = (point: ReturnType<typeof toChartPoints>[number]) => ({
    x: point.x,
    name: point.period,
    y: point.value,
    custom: { nObserved: point.nObserved },
});

export const monitoringSeries = (monitoring: PredictionSetupMonitoring) => {
    const predictions = toChartPoints(monitoring.points.filter(point => point.source === 'prediction'));
    const splits = toChartPoints(monitoring.points.filter(point => point.source === 'evaluation'));

    return {
        evaluationPerSplit: splits.map(toRunPoint),
        // Spans the splits until there are prediction runs, then starts at the last split to reach across the runs.
        evaluation: monitoring.evaluationValue == null
            ? []
            : (predictions.length ? [...splits.slice(-1), ...predictions] : splits)
                    .sort((a, b) => a.x - b.x)
                    .map(point => ({ x: point.x, name: point.period, y: monitoring.evaluationValue })),
        perRun: predictions.map(toRunPoint),
        // Pools all prediction runs so far, a steadier signal than the noisy single runs.
        predictionTrend: predictions.map((point, index) => ({
            x: point.x,
            name: point.period,
            y: point.runningValue,
            custom: { nObserved: predictions.slice(0, index + 1).reduce((sum, run) => sum + run.nObserved, 0) },
        })),
    };
};
