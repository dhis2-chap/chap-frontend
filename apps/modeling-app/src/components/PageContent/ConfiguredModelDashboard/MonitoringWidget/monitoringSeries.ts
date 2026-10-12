import { createFixedPeriodFromPeriodId, DEFAULT_DHIS2_CALENDAR } from '@dhis2-chap/core';
import type { PredictionSetupMonitoring } from '@dhis2-chap/ui';

export const monitoringSeries = (monitoring: PredictionSetupMonitoring) => {
    const points = monitoring.points
        .filter(point => point.source === 'prediction')
        .map(point => ({
            ...point,
            x: Date.parse(createFixedPeriodFromPeriodId({
                periodId: point.period.replace(/-/g, ''),
                calendar: DEFAULT_DHIS2_CALENDAR,
            }).startDate),
        }))
        .sort((a, b) => a.x - b.x);

    return {
        evaluation: points.map(point => ({ x: point.x, name: point.period, y: monitoring.evaluationValue })),
        perRun: points.map(point => ({ x: point.x, name: point.period, y: point.value })),
        running: points.map(point => ({ x: point.x, name: point.period, y: point.runningValue })),
    };
};
