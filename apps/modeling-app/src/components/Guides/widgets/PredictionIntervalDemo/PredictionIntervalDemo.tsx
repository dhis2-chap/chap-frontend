/**
 * MOCK IMPLEMENTATION - For documentation/guides only.
 * This component lets users adjust a confidence level slider to see how
 * prediction interval bands widen or narrow around a median forecast.
 * Do NOT use this component in the actual application.
 */
import { useState, useMemo } from 'react';
import Highcharts from 'highcharts';
import highchartsMore from 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';
import styles from './PredictionIntervalDemo.module.css';

highchartsMore(Highcharts);

const COLORS = {
    actual: '#f68000',
    predicted: '#004bbd',
    band: '#9bbdff',
    gridLine: '#d5dde5',
};

const MONTHS = [
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    'Jan', 'Feb', 'Mar', 'Apr',
];

const ACTUAL = [45, 78, 120, 155, 130, 95, null, null, null, null];
const MEDIAN = [null, null, null, null, null, 95, 72, 55, 40, 35];

const MAX_HALF_WIDTH = [0, 0, 0, 0, 0, 0, 30, 50, 65, 75];

const CONFIDENCE_STEPS = [50, 60, 70, 80, 90, 95] as const;
type ConfidenceLevel = (typeof CONFIDENCE_STEPS)[number];

const scaleFactor = (level: ConfidenceLevel): number => {
    const map: Record<ConfidenceLevel, number> = {
        50: 0.42,
        60: 0.55,
        70: 0.68,
        80: 0.84,
        90: 1.0,
        95: 1.2,
    };
    return map[level];
};

const buildChartOptions = (level: ConfidenceLevel): Highcharts.Options => {
    const factor = scaleFactor(level);

    const bandData: Highcharts.PointOptionsObject[] = [];
    MAX_HALF_WIDTH.forEach((hw, i) => {
        const med = MEDIAN[i];
        if (med !== null && hw !== 0) {
            const half = Math.round(hw * factor);
            bandData.push({ x: i, low: med - half, high: med + half });
        }
    });

    const actualSeries: Highcharts.PointOptionsObject[] = [];
    ACTUAL.forEach((v, i) => {
        if (v !== null) {
            actualSeries.push({ x: i, y: v });
        }
    });

    const medianSeries: Highcharts.PointOptionsObject[] = [];
    MEDIAN.forEach((v, i) => {
        if (v !== null) {
            medianSeries.push({ x: i, y: v });
        }
    });

    return {
        chart: {
            height: 380,
            backgroundColor: 'transparent',
        },
        title: { text: undefined },
        credits: { enabled: false },
        exporting: { enabled: false },
        xAxis: {
            categories: MONTHS,
            labels: {
                style: { fontSize: '0.75rem', color: '#4a5768' },
            },
            title: {
                text: 'Month',
                style: { fontSize: '0.8rem', fontWeight: '500', color: '#212934' },
            },
            plotBands: [
                {
                    from: 4.5,
                    to: 9.5,
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
                },
            ],
        },
        yAxis: {
            title: {
                text: 'Cases',
                style: { fontSize: '0.8rem', fontWeight: '500', color: '#212934' },
            },
            gridLineColor: COLORS.gridLine,
            gridLineDashStyle: 'Dash',
            min: 0,
            max: 200,
        },
        tooltip: {
            shared: true,
            useHTML: true,
            formatter: function () {
                const points = this.points;
                if (!points || points.length === 0) return '';

                let html = `<div style="font-size: 12px; padding: 4px;"><b>${this.x}</b><br/>`;

                const observed = points.find(
                    p => p.series.name === 'Observed cases',
                );
                const median = points.find(
                    p => p.series.name === 'Median prediction',
                );
                const band = points.find(
                    p => p.series.name === `${level}% prediction interval`,
                );

                if (observed) {
                    html += `<span style="color:${COLORS.actual}">\u25CF</span> <b>Observed:</b> ${observed.y} cases<br/>`;
                }
                if (median) {
                    html += `<span style="color:${COLORS.predicted}">\u25CF</span> <b>Median:</b> ${median.y} cases<br/>`;
                }
                if (
                    band &&
                    band.point.low !== undefined &&
                    band.point.high !== undefined
                ) {
                    html += `<span style="color:${COLORS.band}">\u25CF</span> <b>${level}% interval:</b> ${band.point.low}\u2013${band.point.high} cases<br/>`;
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
            itemStyle: { fontSize: '12px', color: '#212934' },
        },
        plotOptions: {
            series: { animation: false },
            spline: { lineWidth: 2.5, marker: { enabled: false } },
            areasplinerange: {
                lineWidth: 0,
                fillOpacity: 0.45,
                marker: { enabled: false },
            },
        },
        series: [
            {
                type: 'areasplinerange' as const,
                name: `${level}% prediction interval`,
                data: bandData,
                color: COLORS.band,
                zIndex: 0,
            },
            {
                type: 'spline' as const,
                name: 'Median prediction',
                data: medianSeries,
                color: COLORS.predicted,
                zIndex: 2,
            },
            {
                type: 'spline' as const,
                name: 'Observed cases',
                data: actualSeries,
                color: COLORS.actual,
                zIndex: 3,
            },
        ],
    };
};

export const PredictionIntervalDemo = () => {
    const [level, setLevel] = useState<ConfidenceLevel>(80);

    const options = useMemo(() => buildChartOptions(level), [level]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const idx = Number(e.target.value);
        setLevel(CONFIDENCE_STEPS[idx]);
    };

    const currentIndex = CONFIDENCE_STEPS.indexOf(level);

    return (
        <div className={styles.container}>
            <div className={styles.chartWrapper}>
                <HighchartsReact highcharts={Highcharts} options={options} />
            </div>
            <div className={styles.sliderContainer}>
                <span className={styles.sliderLabel}>Confidence level</span>
                <input
                    type="range"
                    className={styles.slider}
                    min={0}
                    max={CONFIDENCE_STEPS.length - 1}
                    step={1}
                    value={currentIndex}
                    onChange={handleChange}
                />
                <span className={styles.sliderValue}>
                    {level}
                    %
                </span>
            </div>
            <p className={styles.hint}>
                Drag the slider to see how the prediction band changes with
                confidence level
            </p>
        </div>
    );
};
