import React, { useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import highchartsMore from 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';
import styles from './PredictionAnimation.module.css';

// Initialize highcharts-more for arearange support
highchartsMore(Highcharts);

// Generate period IDs in YYYYMM format for 5 years
const generatePeriods = (startYear: number, numYears: number): string[] => {
    const periods: string[] = [];
    for (let year = startYear; year < startYear + numYears; year++) {
        for (let month = 1; month <= 12; month++) {
            periods.push(`${year}${month.toString().padStart(2, '0')}`);
        }
    }
    return periods;
};

const PERIODS = generatePeriods(2020, 5);

const SHORT_MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const formatPeriod = (periodId: string): string => {
    const year = periodId.slice(2, 4);
    const month = parseInt(periodId.slice(4, 6)) - 1;
    return `${SHORT_MONTH_NAMES[month]} '${year}`;
};

// Actual observed cases (orange line) - seasonal pattern with Jan peak
// Pattern: Jan=peak, Feb-Mar=declining, Apr-Oct=low baseline, Nov-Dec=rising
// Includes natural year-to-year variation and occasional mini-breakouts
const ACTUAL_CASES = [
    // Year 1 (2020) - baseline year
    68, 51, 38, 24, 17, 14, 13, 15, 17, 21, 34, 49,
    // Year 2 (2021) - mini-breakout in late summer
    71, 53, 39, 25, 18, 15, 14, 22, 28, 24, 37, 53,
    // Year 3 (2022) - slightly higher peak, early fall spike
    78, 58, 43, 27, 19, 16, 15, 17, 19, 32, 41, 56,
    // Year 4 (2023) - quieter year
    69, 52, 38, 23, 16, 13, 12, 14, 16, 20, 33, 50,
    // Year 5 (2024) - moderate year
    74, 55, 41, 26, 19, 15, 14, 17, 19, 24, 38, 54,
];

// Prediction start index (Aug '24 = index 55)
const PREDICTION_START_INDEX = 55;

// Model predictions with confidence intervals - only for Aug, Sep, Oct '24 (3 months)
// Shows prediction for period just before the seasonal rise begins
const PREDICTIONS = {
    // 50th percentile (blue line)
    median: [16, 18, 22],
    // 25th percentile
    quantileMidLow: [12, 14, 17],
    // 75th percentile
    quantileMidHigh: [20, 22, 28],
    // 10th percentile - wide range showing uncertainty
    quantileLow: [8, 10, 12],
    // 90th percentile - wide range showing uncertainty
    quantileHigh: [24, 26, 36],
};

// Step 2: Predictions moved 1 month later (Sep '24 = index 56)
const PREDICTION_START_INDEX_STEP2 = 56;

// Predictions for Sep, Oct, Nov '24 - intermediate position with moderate uncertainty
const PREDICTIONS_STEP2 = {
    // 50th percentile (blue line) - slightly lower than actual cases
    median: [17, 21, 33],
    // 25th percentile - moderately wider
    quantileMidLow: [14, 18, 28],
    // 75th percentile - moderately wider
    quantileMidHigh: [24, 31, 47],
    // 10th percentile - moderate uncertainty
    quantileLow: [9, 11, 21],
    // 90th percentile - moderate uncertainty
    quantileHigh: [30, 39, 58],
};

// Step 3: Predictions moved 1 month later (Oct '24 = index 57)
const PREDICTION_START_INDEX_STEP3 = 57;

// Predictions for Oct, Nov, Dec '24 - follows seasonal rise with wider uncertainty
const PREDICTIONS_STEP3 = {
    // 50th percentile (blue line) - lower than actual cases (more deviation)
    median: [21, 32, 45],
    // 25th percentile - wider range
    quantileMidLow: [17, 26, 36],
    // 75th percentile - wider range
    quantileMidHigh: [27, 41, 57],
    // 10th percentile - much wider showing increased uncertainty
    quantileLow: [7, 14, 20],
    // 90th percentile - much wider showing increased uncertainty
    quantileHigh: [38, 60, 85],
};

export type PredictionAnimationStep = 0 | 1 | 2 | 3 | 4;

interface PredictionAnimationProps {
    step?: PredictionAnimationStep;
    showButtons?: boolean;
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
    if (step >= 4) {
        return { predictions: PREDICTIONS_STEP3, startIndex: PREDICTION_START_INDEX_STEP3 };
    }
    if (step >= 3) {
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

// Zoom configuration for step 1 - show last 8 months to clearly display quantiles
const ZOOM_START_INDEX = 52; // May '24
const ZOOM_END_INDEX = 59;   // Dec '24

const getChartOptions = (step: PredictionAnimationStep): Highcharts.Options => {
    const visibility = getSeriesVisibility(step);
    const { predictions, startIndex } = getCurrentPredictionData(step);
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
        series: buildSeries(visibility, predictions, startIndex),
    };
};

export const PredictionAnimation = ({ step = 0, showButtons = false }: PredictionAnimationProps) => {
    const [internalStep, setInternalStep] = useState<PredictionAnimationStep>(2);
    const currentStep = showButtons ? internalStep : step;

    const options = useMemo(() => getChartOptions(currentStep), [currentStep]);

    const handlePrevious = () => {
        setInternalStep(prev => (prev > 2 ? (prev - 1) as PredictionAnimationStep : prev));
    };

    const handleNext = () => {
        setInternalStep(prev => (prev < 4 ? (prev + 1) as PredictionAnimationStep : prev));
    };

    return (
        <div className={styles.container}>
            <div className={styles.chartWrapper}>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={options}
                />
            </div>
            {showButtons && (
                <div className={styles.buttonContainer}>
                    <button
                        className={styles.navButton}
                        onClick={handlePrevious}
                        disabled={internalStep <= 2}
                        aria-label="Previous step"
                    >
                        ←
                    </button>
                    <button
                        className={styles.navButton}
                        onClick={handleNext}
                        disabled={internalStep >= 4}
                        aria-label="Next step"
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
};
