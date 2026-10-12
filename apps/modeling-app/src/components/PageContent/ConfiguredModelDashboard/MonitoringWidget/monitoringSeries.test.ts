import { describe, expect, it } from 'vitest';
import type { PredictionSetupMonitoring } from '@dhis2-chap/ui';
import { monitoringSeries } from './monitoringSeries';

const data: PredictionSetupMonitoring = {
    metricId: 'mae',
    evaluationValue: 0,
    points: [
        { period: '202603', source: 'prediction', value: 8, runningValue: 5, nObserved: 3 },
        { period: '202512', source: 'evaluation', value: 99, runningValue: 99, nObserved: 20 },
        { period: '202601', source: 'prediction', value: 0, runningValue: 0, nObserved: 1 },
    ],
};

describe('monitoring chart data', () => {
    it('compares only prediction runs chronologically and preserves the backend aggregate and zero baseline', () => {
        const series = monitoringSeries(data);
        expect(series.perRun).toEqual([
            { x: Date.UTC(2026, 0, 1), name: '202601', y: 0 },
            { x: Date.UTC(2026, 2, 1), name: '202603', y: 8 },
        ]);
        expect(series.running.map(point => point.y)).toEqual([0, 5]);
        expect(series.evaluation.map(point => point.y)).toEqual([0, 0]);
        expect(data.points[0].period).toBe('202603');
    });

    it('keeps an unavailable baseline missing and supports ISO weeks across year boundaries', () => {
        const series = monitoringSeries({
            ...data,
            evaluationValue: null,
            points: [
                { ...data.points[0], period: '2026-W02' },
                { ...data.points[0], period: '2026W01' },
            ],
        });
        expect(series.perRun.map(point => point.x)).toEqual([Date.UTC(2025, 11, 29), Date.UTC(2026, 0, 5)]);
        expect(series.evaluation.map(point => point.y)).toEqual([null, null]);
    });

    it('does not turn evaluation-only data into production performance', () => {
        const series = monitoringSeries({ ...data, points: [data.points[1]] });
        expect(series).toEqual({ evaluation: [], perRun: [], running: [] });
    });
});
