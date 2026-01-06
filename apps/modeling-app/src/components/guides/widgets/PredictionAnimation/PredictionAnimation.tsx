import React from 'react';
import { motion } from 'motion/react';
import styles from './PredictionAnimation.module.css';

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

// Step 3: Predictions moved 3 months later (Nov '24 = index 22)
const PREDICTION_START_INDEX_STEP3 = 22;

// Predictions for Nov, Dec '24 - follows seasonal rise with wider uncertainty
const PREDICTIONS_STEP3 = {
    // 50th percentile (blue line) - lower than actual cases (more deviation)
    median: [48, 68],
    // 25th percentile - wider range
    quantileMidLow: [36, 52],
    // 75th percentile - wider range
    quantileMidHigh: [62, 88],
    // 10th percentile - much wider showing increased uncertainty
    quantileLow: [35, 50],
    // 90th percentile - much wider showing increased uncertainty
    quantileHigh: [90, 130],
};

export type PredictionAnimationStep = 0 | 1 | 2 | 3 | 4;

interface PredictionAnimationProps {
    step?: PredictionAnimationStep;
}

const WIDTH = 650;
const HEIGHT = 300;
const PADDING = { top: 30, right: 20, bottom: 55, left: 55 };
const CHART_WIDTH = WIDTH - PADDING.left - PADDING.right;
const CHART_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

// Calculate min/max from all data points
const allValues = [
    ...ACTUAL_CASES,
    ...PREDICTIONS.quantileLow,
    ...PREDICTIONS.quantileHigh,
];
const MIN_VALUE = Math.min(...allValues) - 5;
const MAX_VALUE = Math.max(...allValues) + 10;

const getY = (value: number): number => {
    return CHART_HEIGHT - ((value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * CHART_HEIGHT;
};

const getX = (index: number): number => {
    return (index / (PERIODS.length - 1)) * CHART_WIDTH;
};

// Create SVG path for a line
const createLinePath = (data: number[], startIndex = 0): string => {
    return data
        .map((value, index) => {
            const x = getX(startIndex + index);
            const y = getY(value);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');
};

// Create SVG path for an area range (for quantile bands)
const createAreaPath = (lowData: number[], highData: number[], startIndex = 0): string => {
    // Go forward along the top (high values)
    const topPath = highData
        .map((value, index) => {
            const x = getX(startIndex + index);
            const y = getY(value);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');

    // Go backward along the bottom (low values) to close the shape
    const bottomPath = lowData
        .slice()
        .reverse()
        .map((value, index) => {
            const x = getX(startIndex + lowData.length - 1 - index);
            const y = getY(value);
            return `L ${x} ${y}`;
        })
        .join(' ');

    return `${topPath} ${bottomPath} Z`;
};

// Calculate path length for stroke animation
const calculatePathLength = (data: number[]): number => {
    let length = 0;
    for (let i = 1; i < data.length; i++) {
        const x1 = getX(i - 1);
        const y1 = getY(data[i - 1]);
        const x2 = getX(i);
        const y2 = getY(data[i]);
        length += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    return Math.ceil(length);
};

const ACTUAL_PATH_LENGTH = calculatePathLength(ACTUAL_CASES);

export const PredictionAnimation = ({ step = 0 }: PredictionAnimationProps) => {
    // Select prediction data based on step
    const getCurrentPredictionData = () => {
        if (step >= 3) {
            return { predictions: PREDICTIONS_STEP3, startIndex: PREDICTION_START_INDEX_STEP3 };
        }
        if (step >= 2) {
            return { predictions: PREDICTIONS_STEP2, startIndex: PREDICTION_START_INDEX_STEP2 };
        }
        return { predictions: PREDICTIONS, startIndex: PREDICTION_START_INDEX };
    };

    const { predictions: currentPredictions, startIndex: currentStartIndex } = getCurrentPredictionData();

    const outerAreaPath = createAreaPath(currentPredictions.quantileLow, currentPredictions.quantileHigh, currentStartIndex);
    const middleAreaPath = createAreaPath(currentPredictions.quantileMidLow, currentPredictions.quantileMidHigh, currentStartIndex);
    const predictedLinePath = createLinePath(currentPredictions.median, currentStartIndex);
    const actualLinePath = createLinePath(ACTUAL_CASES);

    const predictedPathLength = calculatePathLength(currentPredictions.median);

    const yTicks = [0, 25, 50, 75, 100, 125, 150];

    // Step mapping:
    // Step 0: Only actual cases line (orange disease data)
    // Step 1: Add all prediction elements (quantiles + median) at Aug-Oct position
    // Step 2: Move predictions to Sep-Nov position with moderate quantiles
    // Step 3: Move predictions to Nov-Dec position with wider quantiles
    const showActualLine = step >= 0;
    const showPredictedLine = step >= 1;
    const showOuterQuantile = step >= 1;
    const showMiddleQuantile = step >= 1;

    return (
        <div className={styles.container}>
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className={styles.chart}
                role="img"
                aria-label="Animation showing model prediction confidence ranges compared to actual disease cases"
            >
                <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
                    {/* Y-axis grid lines and labels */}
                    {yTicks.map((tick) => {
                        const y = getY(tick);
                        if (y < 0 || y > CHART_HEIGHT) return null;
                        return (
                            <g key={tick}>
                                <line
                                    x1={0}
                                    y1={y}
                                    x2={CHART_WIDTH}
                                    y2={y}
                                    className={styles.gridLine}
                                />
                                <text
                                    x={-10}
                                    y={y}
                                    className={styles.axisLabel}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                >
                                    {tick}
                                </text>
                            </g>
                        );
                    })}

                    {/* X-axis labels - show only every 3rd month to avoid overlap */}
                    {PERIODS.map((period, index) => {
                        // Show Jan (with year), Apr, Jul, Oct
                        const showLabel = index % 3 === 0;
                        if (!showLabel) return null;
                        return (
                            <motion.text
                                key={`${period}-${index}`}
                                x={getX(index)}
                                y={CHART_HEIGHT + 25}
                                className={styles.axisLabel}
                                textAnchor="middle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.03, duration: 0.3 }}
                            >
                                {period}
                            </motion.text>
                        );
                    })}

                    {/* Y-axis title */}
                    <text
                        transform={`translate(-40, ${CHART_HEIGHT / 2}) rotate(-90)`}
                        className={styles.axisTitle}
                        textAnchor="middle"
                    >
                        Cases
                    </text>

                    {/* X-axis title */}
                    <text
                        x={CHART_WIDTH / 2}
                        y={CHART_HEIGHT + 45}
                        className={styles.axisTitle}
                        textAnchor="middle"
                    >
                        Month
                    </text>

                    {/* Outer quantile range (90% confidence) */}
                    <motion.path
                        d={outerAreaPath}
                        className={styles.outerQuantileArea}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showOuterQuantile ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />

                    {/* Middle quantile range (50% confidence) */}
                    <motion.path
                        d={middleAreaPath}
                        className={styles.middleQuantileArea}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showMiddleQuantile ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />

                    {/* Predicted cases line (median) */}
                    <motion.path
                        d={predictedLinePath}
                        className={styles.predictedLine}
                        strokeDasharray={predictedPathLength}
                        initial={{ strokeDashoffset: predictedPathLength, opacity: 0 }}
                        animate={{
                            strokeDashoffset: showPredictedLine ? 0 : predictedPathLength,
                            opacity: showPredictedLine ? 1 : 0,
                        }}
                        transition={{
                            strokeDashoffset: { duration: 1.0, ease: 'easeInOut' },
                            opacity: { duration: 0.3 },
                        }}
                    />

                    {/* Actual cases line */}
                    <motion.path
                        d={actualLinePath}
                        className={styles.actualLine}
                        strokeDasharray={ACTUAL_PATH_LENGTH}
                        initial={{ strokeDashoffset: ACTUAL_PATH_LENGTH, opacity: 0 }}
                        animate={{
                            strokeDashoffset: showActualLine ? 0 : ACTUAL_PATH_LENGTH,
                            opacity: showActualLine ? 1 : 0,
                        }}
                        transition={{
                            strokeDashoffset: { duration: 1.0, ease: 'easeInOut' },
                            opacity: { duration: 0.3 },
                        }}
                    />
                </g>
            </svg>

            {/* Legend - only show items that are visible */}
            <div className={styles.legend}>
                {showActualLine && (
                    <div className={styles.legendItem}>
                        <span className={styles.actualLegend}></span>
                        <span>Real Cases</span>
                    </div>
                )}
                {showPredictedLine && (
                    <div className={styles.legendItem}>
                        <span className={styles.predictedLegend}></span>
                        <span>Predicted Cases</span>
                    </div>
                )}
                {showOuterQuantile && (
                    <div className={styles.legendItem}>
                        <span className={styles.outerQuantileLegend}></span>
                        <span>90% Confidence</span>
                    </div>
                )}
                {showMiddleQuantile && (
                    <div className={styles.legendItem}>
                        <span className={styles.middleQuantileLegend}></span>
                        <span>50% Confidence</span>
                    </div>
                )}
            </div>
        </div>
    );
};
