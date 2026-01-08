import { useMemo } from 'react';
import Highcharts from 'highcharts';
import {
    ACTUAL_CASES,
    COLORS,
    PERIODS,
    STEP_CONFIGS,
    ZOOM_END_INDEX,
    ZOOM_START_INDEX,
    formatPeriod,
    type PredictionData,
    type StepConfig,
} from './PredictionAnimationData';

export type PredictionAnimationStep = 0 | 1 | 2 | 3 | 4;

const getStepConfig = (step: PredictionAnimationStep): StepConfig => {
    if (step >= 4) {
        return STEP_CONFIGS[2];
    }
    if (step >= 3) {
        return STEP_CONFIGS[1];
    }
    return STEP_CONFIGS[0];
};

const getSeriesVisibility = (step: PredictionAnimationStep) => ({
    actualLine: step >= 0,
    predictedLine: step >= 1,
    outerQuantile: step >= 1,
    middleQuantile: step >= 1,
});

const buildActualCasesSeries = (): Highcharts.PointOptionsObject[] =>
    ACTUAL_CASES.map((value, index) => ({
        x: index,
        y: value,
    }));

const buildPredictionSeries = (
    predictions: PredictionData,
    startIndex: number,
): {
    median: Highcharts.PointOptionsObject[];
    outerRange: Highcharts.PointOptionsObject[];
    midRange: Highcharts.PointOptionsObject[];
} => ({
    median: predictions.median.map((value, i) => ({
        x: startIndex + i,
        y: value,
    })),
    outerRange: predictions.median.map((_, i) => ({
        x: startIndex + i,
        low: predictions.quantileLow[i],
        high: predictions.quantileHigh[i],
    })),
    midRange: predictions.median.map((_, i) => ({
        x: startIndex + i,
        low: predictions.quantileMidLow[i],
        high: predictions.quantileMidHigh[i],
    })),
});

const buildSeries = (
    visibility: ReturnType<typeof getSeriesVisibility>,
    config: StepConfig,
): Highcharts.SeriesOptionsType[] => {
    const predictionData = buildPredictionSeries(config.predictions, config.startIndex);

    return [
        // Outer quantile range (80% prediction interval) - render first (lowest zIndex)
        {
            type: 'areasplinerange' as const,
            name: '80% prediction interval',
            data: predictionData.outerRange,
            color: COLORS.outerQuantile,
            visible: visibility.outerQuantile,
            showInLegend: visibility.outerQuantile,
            zIndex: 0,
            lineWidth: 0,
            fillOpacity: 1,
            marker: { enabled: false },
        },
        // Middle quantile range (50% prediction interval)
        {
            type: 'areasplinerange' as const,
            name: '50% prediction interval',
            data: predictionData.midRange,
            color: COLORS.middleQuantile,
            visible: visibility.middleQuantile,
            showInLegend: visibility.middleQuantile,
            zIndex: 1,
            lineWidth: 0,
            fillOpacity: 1,
            marker: { enabled: false },
        },
        // Predicted cases line (median)
        {
            type: 'spline' as const,
            name: 'Median prediction',
            data: predictionData.median,
            color: COLORS.predicted,
            visible: visibility.predictedLine,
            showInLegend: visibility.predictedLine,
            zIndex: 3,
            lineWidth: 2.5,
            marker: { enabled: false },
        },
        // Actual cases line (always on top)
        {
            type: 'spline' as const,
            name: 'Real Cases',
            data: buildActualCasesSeries(),
            color: COLORS.actual,
            visible: visibility.actualLine,
            showInLegend: visibility.actualLine,
            zIndex: 4,
            lineWidth: 2.5,
            marker: { enabled: false },
        },
    ];
};

const buildChartOptions = (step: PredictionAnimationStep): Highcharts.Options => {
    const visibility = getSeriesVisibility(step);
    const config = getStepConfig(step);
    const isZoomed = step === 1;

    return {
        chart: {
            height: 300,
            backgroundColor: 'transparent',
            animation: {
                duration: 500,
            },
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
            categories: PERIODS,
            min: isZoomed ? ZOOM_START_INDEX : undefined,
            max: isZoomed ? ZOOM_END_INDEX : undefined,
            labels: {
                step: isZoomed ? 1 : 6,
                formatter: function () {
                    return formatPeriod(this.value.toString());
                },
                style: {
                    fontSize: '0.75rem',
                    color: '#4a5768',
                },
            },
            title: {
                text: 'Period',
                style: {
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: '#212934',
                },
            },
        },
        yAxis: {
            title: {
                text: 'Cases',
                style: {
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#212934',
                },
            },
            gridLineColor: COLORS.gridLine,
            gridLineDashStyle: 'Dash',
            min: 0,
            max: isZoomed ? 45 : 95,
        },
        tooltip: {
            shared: true,
            valueSuffix: ' cases',
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
                animation: {
                    duration: 500,
                },
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
        series: buildSeries(visibility, config),
    };
};

export const usePredictionChart = (step: PredictionAnimationStep): Highcharts.Options => {
    return useMemo(() => buildChartOptions(step), [step]);
};
