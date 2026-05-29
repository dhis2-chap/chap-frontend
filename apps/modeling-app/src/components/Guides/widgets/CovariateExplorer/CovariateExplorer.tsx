/**
 * MOCK IMPLEMENTATION - For documentation/guides only.
 * This component displays an interactive chart showing how covariates
 * (rainfall, temperature) relate to predicted disease cases.
 * Do NOT use this component in the actual application.
 */
import { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import styles from './CovariateExplorer.module.css';

const COLORS = {
    cases: '#f68000',
    rainfall: '#004bbd',
    temperature: '#d32f2f',
    gridLine: '#d5dde5',
};

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CASES = [38, 30, 22, 18, 24, 45, 78, 120, 155, 130, 85, 52];
const RAINFALL = [20, 15, 30, 80, 160, 220, 260, 240, 180, 100, 45, 25];
const TEMPERATURE = [22, 23, 25, 28, 30, 31, 29, 28, 27, 26, 24, 22];

interface CovariateToggle {
    rainfall: boolean;
    temperature: boolean;
}

const buildChartOptions = (
    covariates: CovariateToggle,
): Highcharts.Options => {
    const series: Highcharts.SeriesOptionsType[] = [
        {
            type: 'spline',
            name: 'Malaria cases',
            data: CASES,
            color: COLORS.cases,
            yAxis: 0,
            lineWidth: 2.5,
            marker: { enabled: false },
            zIndex: 3,
        },
    ];

    const yAxes: Highcharts.YAxisOptions[] = [
        {
            title: {
                text: 'Malaria cases',
                style: { fontSize: '0.8rem', fontWeight: '500', color: COLORS.cases },
            },
            gridLineColor: COLORS.gridLine,
            gridLineDashStyle: 'Dash',
            min: 0,
        },
    ];

    if (covariates.rainfall) {
        yAxes.push({
            title: {
                text: 'Rainfall (mm)',
                style: { fontSize: '0.8rem', fontWeight: '500', color: COLORS.rainfall },
            },
            opposite: true,
            gridLineWidth: 0,
            min: 0,
        });

        series.push({
            type: 'column',
            name: 'Rainfall (mm)',
            data: RAINFALL,
            color: COLORS.rainfall,
            opacity: 0.35,
            yAxis: yAxes.length - 1,
            zIndex: 1,
        });
    }

    if (covariates.temperature) {
        yAxes.push({
            title: {
                text: 'Temperature (\u00B0C)',
                style: { fontSize: '0.8rem', fontWeight: '500', color: COLORS.temperature },
            },
            opposite: true,
            gridLineWidth: 0,
            min: 15,
            max: 35,
        });

        series.push({
            type: 'spline',
            name: 'Temperature (\u00B0C)',
            data: TEMPERATURE,
            color: COLORS.temperature,
            yAxis: yAxes.length - 1,
            lineWidth: 2,
            dashStyle: 'ShortDash',
            marker: { enabled: false },
            zIndex: 2,
        });
    }

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
        },
        yAxis: yAxes,
        tooltip: {
            shared: true,
            useHTML: true,
            formatter: function () {
                const points = this.points;
                if (!points || points.length === 0) return '';

                let html = `<div style="font-size: 12px; padding: 4px;"><b>${this.x}</b><br/>`;
                for (const point of points) {
                    html += `<span style="color:${point.color}">●</span> <b>${point.series.name}:</b> ${point.y}<br/>`;
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
            spline: { marker: { enabled: false } },
        },
        series,
    };
};

export const CovariateExplorer = () => {
    const [covariates, setCovariates] = useState<CovariateToggle>({
        rainfall: true,
        temperature: false,
    });

    const setCovariateVisibility = (
        key: keyof CovariateToggle,
        checked: boolean,
    ) => {
        setCovariates(prev => ({ ...prev, [key]: checked }));
    };

    const options = buildChartOptions(covariates);

    return (
        <div className={styles.container}>
            <div className={styles.chartWrapper}>
                <HighchartsReact highcharts={Highcharts} options={options} />
            </div>
            <div className={styles.toggleContainer}>
                <label className={styles.toggleCheckbox}>
                    <input
                        type="checkbox"
                        checked={covariates.rainfall}
                        onChange={event => setCovariateVisibility('rainfall', event.target.checked)}
                    />
                    <span>Rainfall</span>
                    <span
                        className={styles.indicator}
                        style={{ backgroundColor: COLORS.rainfall }}
                    />
                </label>
                <label className={styles.toggleCheckbox}>
                    <input
                        type="checkbox"
                        checked={covariates.temperature}
                        onChange={event => setCovariateVisibility('temperature', event.target.checked)}
                    />
                    <span>Temperature</span>
                    <span
                        className={styles.indicator}
                        style={{ backgroundColor: COLORS.temperature }}
                    />
                </label>
            </div>
            <p className={styles.hint}>
                Toggle covariates to see how they relate to disease cases
            </p>
        </div>
    );
};
