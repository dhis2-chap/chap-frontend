import React from 'react';
import Highcharts from 'highcharts';
import highchartsMore from 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';
import styles from './ModelOutputChart.module.css';

// Initialize highcharts-more for arearange support
highchartsMore(Highcharts);

// Colors matching app charts
const COLORS = {
    actual: '#f68000',
    predicted: '#004bbd',
    outerQuantile: '#c4dcf2',
    middleQuantile: '#9bbdff',
    gridLine: '#d5dde5',
};

// 4 months of actual disease data with a steeper upward trend
const ACTUAL_DATA = [
    { month: 'Sep', value: 28 },
    { month: 'Oct', value: 42 },
    { month: 'Nov', value: 64 },
    { month: 'Dec', value: 95 },
];

// 3 months of predictions with expanding uncertainty (horn shape)
// The prediction starts from the last actual value and continues steeply upward
const PREDICTIONS = {
    months: ['Dec', 'Jan', 'Feb', 'Mar'],
    // Median line continuing the steep upward trend
    median: [95, 130, 175, 230],
    // Inner quantile (50% interval) - narrow at start, wider at end
    innerLow: [95, 115, 145, 175],
    innerHigh: [95, 145, 205, 285],
    // Outer quantile (80% interval) - even wider expansion
    outerLow: [95, 100, 110, 120],
    outerHigh: [95, 160, 240, 340],
};

const buildChartOptions = (): Highcharts.Options => {
    const categories = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

    // Build actual data series (indices 0-3)
    const actualSeries: Highcharts.PointOptionsObject[] = ACTUAL_DATA.map((d, i) => ({
        x: i,
        y: d.value,
    }));

    // Build prediction series (indices 3-6, starting from last actual point)
    const predictionMedian: Highcharts.PointOptionsObject[] = PREDICTIONS.median.map((v, i) => ({
        x: 3 + i,
        y: v,
    }));

    const outerRange: Highcharts.PointOptionsObject[] = PREDICTIONS.median.map((_, i) => ({
        x: 3 + i,
        low: PREDICTIONS.outerLow[i],
        high: PREDICTIONS.outerHigh[i],
    }));

    const innerRange: Highcharts.PointOptionsObject[] = PREDICTIONS.median.map((_, i) => ({
        x: 3 + i,
        low: PREDICTIONS.innerLow[i],
        high: PREDICTIONS.innerHigh[i],
    }));

    return {
        chart: {
            height: 380,
            backgroundColor: 'transparent',
        },
        title: {
            text: undefined,
        },
        credits: {
            enabled: false,
        },
        exporting: {
            enabled: false,
        },
        xAxis: {
            categories,
            labels: {
                style: {
                    fontSize: '0.75rem',
                    color: '#4a5768',
                },
            },
            title: {
                text: 'Month',
                style: {
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: '#212934',
                },
            },
            plotBands: [{
                from: 2.5,
                to: 6.5,
                color: 'rgba(0, 75, 189, 0.03)',
                label: {
                    text: 'Forecast',
                    style: {
                        color: '#004bbd',
                        fontSize: '0.7rem',
                        fontWeight: '500',
                    },
                    y: 15,
                },
            }],
        },
        yAxis: {
            title: {
                text: 'Cases',
                style: {
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: '#212934',
                },
            },
            gridLineColor: COLORS.gridLine,
            gridLineDashStyle: 'Dash',
            min: 0,
            max: 380,
        },
        tooltip: {
            shared: true,
            useHTML: true,
            formatter: function () {
                const points = this.points;
                if (!points || points.length === 0) return '';

                const month = this.x;
                let html = `<div style="font-size: 12px; padding: 4px;"><b>${month}</b><br/>`;

                // Find each series type
                const observed = points.find(p => p.series.name === 'Observed cases');
                const median = points.find(p => p.series.name === 'Median prediction');
                const inner = points.find(p => p.series.name === '50% prediction interval');
                const outer = points.find(p => p.series.name === '80% prediction interval');

                if (observed) {
                    html += `<span style="color:${COLORS.actual}">●</span> <b>Observed:</b> ${observed.y} cases<br/>`;
                    html += `<span style="font-size: 10px; color: #666;">Actual recorded disease cases</span><br/>`;
                }

                // Only show prediction data if we're past the transition point (December)
                // At December, observed and predicted overlap so we just show observed
                const isTransitionPoint = observed && inner && inner.point.low === inner.point.high;

                if (median && !isTransitionPoint) {
                    html += `<span style="color:${COLORS.predicted}">●</span> <b>Median prediction:</b> ${median.y} cases<br/>`;
                    html += `<span style="font-size: 10px; color: #666;">The model's best estimate</span><br/>`;
                }

                // Only show intervals if they have a range (skip December where all values are the same)
                if (inner && inner.point.low !== undefined && inner.point.high !== undefined && inner.point.low !== inner.point.high && !isTransitionPoint) {
                    html += `<span style="color:${COLORS.middleQuantile}">●</span> <b>50% interval:</b> ${inner.point.low}–${inner.point.high} cases<br/>`;
                    html += `<span style="font-size: 10px; color: #666;">50% chance the true value falls here</span><br/>`;
                }

                if (outer && outer.point.low !== undefined && outer.point.high !== undefined && outer.point.low !== outer.point.high && !isTransitionPoint) {
                    html += `<span style="color:${COLORS.outerQuantile}">●</span> <b>80% interval:</b> ${outer.point.low}–${outer.point.high} cases<br/>`;
                    html += `<span style="font-size: 10px; color: #666;">80% chance the true value falls here</span>`;
                }

                html += '</div>';
                return html;
            },
        },
        legend: {
            enabled: true,
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom',
            itemStyle: {
                fontSize: '12px',
                color: '#212934',
            },
        },
        plotOptions: {
            series: {
                animation: false,
            },
            spline: {
                lineWidth: 2.5,
                marker: {
                    enabled: false,
                },
            },
            areasplinerange: {
                lineWidth: 0,
                fillOpacity: 1,
                marker: {
                    enabled: false,
                },
            },
        },
        series: [
            // Outer quantile range (80% prediction interval)
            {
                type: 'areasplinerange' as const,
                name: '80% prediction interval',
                data: outerRange,
                color: COLORS.outerQuantile,
                zIndex: 0,
                lineWidth: 0,
                fillOpacity: 1,
                marker: { enabled: false },
            },
            // Inner quantile range (50% prediction interval)
            {
                type: 'areasplinerange' as const,
                name: '50% prediction interval',
                data: innerRange,
                color: COLORS.middleQuantile,
                zIndex: 1,
                lineWidth: 0,
                fillOpacity: 1,
                marker: { enabled: false },
            },
            // Predicted median line
            {
                type: 'spline' as const,
                name: 'Median prediction',
                data: predictionMedian,
                color: COLORS.predicted,
                zIndex: 3,
                lineWidth: 2.5,
                marker: { enabled: false },
            },
            // Actual cases line
            {
                type: 'spline' as const,
                name: 'Observed cases',
                data: actualSeries,
                color: COLORS.actual,
                zIndex: 4,
                lineWidth: 2.5,
                marker: { enabled: false },
            },
        ],
    };
};

export const ModelOutputChart = () => {
    const options = buildChartOptions();

    return (
        <div className={styles.container}>
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
            />
        </div>
    );
};
