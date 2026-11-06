import { describe, expect, it } from 'vitest';
import type { MonitoringSource, PredictionSetupMonitoring } from '@dhis2-chap/ui';
import { monitoringSeries } from './monitoringSeries';

const data: PredictionSetupMonitoring = {
    metricId: 'mae',
    baselineModel: 'persistence',
    comparisonDescription: 'Improvement over the reference.',
    evaluationValue: 0,
    points: [
        { period: '202603', source: 'prediction' as MonitoringSource, value: 8, runningValue: 5, nObserved: 3 },
        { period: '202512', source: 'evaluation' as MonitoringSource, value: 99, runningValue: 99, nObserved: 20 },
        { period: '202601', source: 'prediction' as MonitoringSource, value: 0, runningValue: 0, nObserved: 1 },
    ],
};

describe('monitoringSeries', () => {
    it('splits backtest splits from prediction runs and sorts them chronologically', () => {
        const series = monitoringSeries(data);
        expect(series.evaluationPerSplit).toEqual([{ x: Date.UTC(2025, 11, 1), name: '202512', y: 99, custom: { nObserved: 20 } }]);
        expect(series.perRun).toEqual([
            { x: Date.UTC(2026, 0, 1), name: '202601', y: 0, custom: { nObserved: 1 } },
            { x: Date.UTC(2026, 2, 1), name: '202603', y: 8, custom: { nObserved: 3 } },
        ]);
        expect(series.evaluation.map(point => point.name)).toEqual(['202512', '202601', '202603']);
        expect(series.predictionTrend).toEqual([
            { x: Date.UTC(2026, 0, 1), name: '202601', y: 0, custom: { nObserved: 1 } },
            { x: Date.UTC(2026, 2, 1), name: '202603', y: 5, custom: { nObserved: 4 } },
        ]);
    });

    it('parses ISO weeks across year boundaries and leaves out a missing evaluation score', () => {
        const series = monitoringSeries({
            ...data,
            evaluationValue: null,
            points: [
                { ...data.points[0], period: '2026-W02' },
                { ...data.points[0], period: '2026W01' },
            ],
        });
        expect(series.perRun.map(point => point.x)).toEqual([Date.UTC(2025, 11, 29), Date.UTC(2026, 0, 5)]);
        expect(series.evaluation).toEqual([]);
    });
});
