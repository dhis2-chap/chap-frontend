import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type Highcharts from 'highcharts';
import type { PredictionOrgUnitSeries } from '../../../interfaces/Prediction';
import { UncertaintyAreaChart } from './UncertaintyAreaChart';

const captured = vi.hoisted(() => ({ options: {} as Highcharts.Options }));
vi.mock('highcharts-react-official', () => ({
    default: ({ options }: { options: Highcharts.Options }) => {
        captured.options = options;
        return null;
    },
}));
vi.mock('../../../utils/registerHighchartsModules', () => ({ registerHighchartsModules: vi.fn() }));

const series: PredictionOrgUnitSeries = {
    targetId: 'cases', orgUnitId: 'region', orgUnitName: 'Region',
    points: [{
        period: '2024W01', periodLabel: 'Week 1',
        quantiles: { quantile_low: 1, quantile_mid_low: 2, median: 3, quantile_mid_high: 4, quantile_high: 5 },
    }],
};

describe('recorded alert chart periods', () => {
    it('renders each policy threshold with its label and colour, preserving gaps', () => {
        renderToStaticMarkup(createElement(UncertaintyAreaChart, {
            series: { ...series, actualCases: [{ period: '2023W52', value: 2 }] },
            predictionTargetName: 'Cases',
            thresholdLines: [
                { id: 'watch', label: 'Policy: Watch', color: '#123456', points: [{ period: '2024W1', value: 10 }] },
                { id: 'action', label: 'Policy: Action', color: '#654321', points: [{ period: '2023W52', value: 20 }, { period: '2024W01', value: null }] },
            ],
        }));
        expect(captured.options.series?.filter(item => ['watch', 'action'].includes(item.id ?? ''))).toMatchObject([
            { id: 'watch', type: 'line', name: 'Policy: Watch', color: '#123456', data: [{ y: null }, { y: 10 }] },
            { id: 'action', type: 'line', name: 'Policy: Action', color: '#654321', data: [{ y: 20 }, { y: null }] },
        ]);
        expect((captured.options.xAxis as Highcharts.XAxisOptions).plotBands).toEqual([]);
    });

    it('matches canonical periods, uses the configured colour and ignores periods outside the chart', () => {
        renderToStaticMarkup(createElement(UncertaintyAreaChart, {
            series, predictionTargetName: 'Cases',
            alertPeriods: [
                { period: '2024W1', label: 'Watch', color: '#ffead5' },
                { period: '2023W01', label: 'Action', color: '#fce2e2' },
            ],
        }));
        expect((captured.options.xAxis as Highcharts.XAxisOptions).plotBands).toEqual([
            { from: -0.5, to: 0.5, color: '#ffead5' },
        ]);
    });

    it('does not present exploratory exceedances as recorded alerts when no alerts were raised', () => {
        renderToStaticMarkup(createElement(UncertaintyAreaChart, {
            series, predictionTargetName: 'Cases', alertPeriods: [],
            outbreakPeriods: [{ period: '2024W01', outbreak: true, value: '1', supportedProbability: 90 }],
        }));
        expect((captured.options.xAxis as Highcharts.XAxisOptions).plotBands).toEqual([]);
    });

    it('escapes custom labels in chart tooltips', () => {
        renderToStaticMarkup(createElement(UncertaintyAreaChart, {
            series, predictionTargetName: 'Cases',
            alertPeriods: [{ period: '2024W1', label: '<b>Watch</b>', color: '#ffead5' }],
        }));
        const formatter = captured.options.tooltip!.formatter!;
        const tooltip = formatter.call({ x: '2024W01', points: [] } as unknown as Highcharts.TooltipFormatterContextObject, {} as Highcharts.Tooltip);
        expect(tooltip).toContain('&lt;b&gt;Watch&lt;/b&gt;');
    });
});
