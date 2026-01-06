import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import highchartsMore from 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';
import styles from './PredictionAnimation.module.css';

// Initialize highcharts-more for arearange support
highchartsMore(Highcharts);

// Simulated evaluation data - 2 years of actual cases and model predictions
const PERIODS = [
    // Year 1
    'Jan \'23', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    // Year 2
    'Jan \'24', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Actual observed cases (orange line) - seasonal pattern with Jan peak
// Pattern: Jan=peak, Feb-Mar=declining, Apr-Oct=low baseline, Nov-Dec=rising
const ACTUAL_CASES = [
    // Year 1 (2023)
    118, 88, 65, 40, 30, 24, 22, 26, 28, 35, 58, 85,
    // Year 2 (2024)
    122, 90, 68, 42, 32, 25, 23, 28, 30, 38, 62, 88,
];

// Prediction start index (Aug '24 = index 19)
const PREDICTION_START_INDEX = 19;

// Model predictions with confidence intervals - only for Aug, Sep, Oct '24 (3 months)
// Shows prediction for period just before the seasonal rise begins
const PREDICTIONS = {
    // 50th percentile (blue line)
    median: [26, 28, 36],
    // 25th percentile
    quantileMidLow: [20, 22, 28],
    // 75th percentile
    quantileMidHigh: [32, 34, 46],
    // 10th percentile - wide range showing uncertainty
    quantileLow: [14, 16, 20],
    // 90th percentile - wide range showing uncertainty
    quantileHigh: [38, 42, 58],
};

// Step 2: Predictions moved 1 month later (Sep '24 = index 20)
const PREDICTION_START_INDEX_STEP2 = 20;

// Predictions for Sep, Oct, Nov '24 - intermediate position with moderate uncertainty
const PREDICTIONS_STEP2 = {
    // 50th percentile (blue line) - slightly lower than actual cases
    median: [26, 32, 52],
    // 25th percentile - moderately wider
    quantileMidLow: [22, 28, 46],
    // 75th percentile - moderately wider
    quantileMidHigh: [38, 50, 76],
    // 10th percentile - moderate uncertainty
    quantileLow: [14, 18, 34],
    // 90th percentile - moderate uncertainty
    quantileHigh: [48, 62, 92],
};

// Step 3: Predictions moved 3 months later (Oct '24 = index 21)
const PREDICTION_START_INDEX_STEP3 = 21;

// Predictions for Oct, Nov, Dec '24 - follows seasonal rise with wider uncertainty
const PREDICTIONS_STEP3 = {
    // 50th percentile (blue line) - lower than actual cases (more deviation)
    median: [34, 52, 72],
    // 25th percentile - wider range
    quantileMidLow: [28, 42, 58],
    // 75th percentile - wider range
    quantileMidHigh: [44, 66, 92],
    // 10th percentile - much wider showing increased uncertainty
    quantileLow: [20, 32, 46],
    // 90th percentile - much wider showing increased uncertainty
    quantileHigh: [52, 82, 120],
};

export type PredictionAnimationStep = 0 | 1 | 2 | 3 | 4;

interface PredictionAnimationProps {
    step?: PredictionAnimationStep;
}

// Colors matching app charts
const COLORS = {
    actual: '#f68000',
    predicted: '#004bbd',
    outerQuantile: '#c4dcf2',
    middleQuantile: '#9bbdff',
    gridLine: '#d5dde5',
};

type PredictionData = typeof PREDICTIONS;

const getCurrentPredictionData = (step: PredictionAnimationStep): {
    predictions: PredictionData;
    startIndex: number;
} => {
    if (step >= 3) {
        return { predictions: PREDICTIONS_STEP3, startIndex: PREDICTION_START_INDEX_STEP3 };
    }
    if (step >= 2) {
        return { predictions: PREDICTIONS_STEP2, startIndex: PREDICTION_START_INDEX_STEP2 };
    }
    return { predictions: PREDICTIONS, startIndex: PREDICTION_START_INDEX };
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
    predictions: PredictionData,
    startIndex: number,
): Highcharts.SeriesOptionsType[] => {
    const predictionData = buildPredictionSeries(predictions, startIndex);

    return [
        // Outer quantile range (90% confidence) - render first (lowest zIndex)
        {
            type: 'arearange' as const,
            name: '90% Confidence',
            data: predictionData.outerRange,
            color: COLORS.outerQuantile,
            visible: visibility.outerQuantile,
            showInLegend: visibility.outerQuantile,
            zIndex: 0,
            lineWidth: 0,
            fillOpacity: 1,
            marker: { enabled: false },
        },
        // Middle quantile range (50% confidence)
        {
            type: 'arearange' as const,
            name: '50% Confidence',
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
            type: 'line' as const,
            name: 'Predicted Cases',
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
            type: 'line' as const,
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

const getChartOptions = (step: PredictionAnimationStep): Highcharts.Options => {
    const visibility = getSeriesVisibility(step);
    const { predictions, startIndex } = getCurrentPredictionData(step);

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
        xAxis: {
            categories: PERIODS,
            labels: {
                step: 3,
                style: {
                    fontSize: '11px',
                    color: '#4a5768',
                },
            },
            title: {
                text: 'Month',
                style: {
                    fontSize: '12px',
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
            max: 150,
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
            line: {
                lineWidth: 2.5,
                marker: {
                    enabled: false,
                },
            },
            arearange: {
                lineWidth: 0,
                fillOpacity: 1,
                marker: {
                    enabled: false,
                },
            },
        },
        series: buildSeries(visibility, predictions, startIndex),
    };
};

export const PredictionAnimation = ({ step = 0 }: PredictionAnimationProps) => {
    const options = useMemo(() => getChartOptions(step), [step]);

    // Use key to force re-render when prediction position changes
    const chartKey = step >= 3 ? 'step3' : step >= 2 ? 'step2' : step >= 1 ? 'step1' : 'step0';

    return (
        <div className={styles.container}>
            <div className={styles.chartWrapper}>
                <HighchartsReact
                    key={chartKey}
                    highcharts={Highcharts}
                    options={options}
                />
            </div>
        </div>
    );
};
