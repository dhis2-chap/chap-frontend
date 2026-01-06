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

export const PERIODS = generatePeriods(2020, 5);

const SHORT_MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const formatPeriod = (periodId: string): string => {
    const year = periodId.slice(2, 4);
    const month = parseInt(periodId.slice(4, 6)) - 1;
    return `${SHORT_MONTH_NAMES[month]} '${year}`;
};

// Actual observed cases (orange line) - seasonal pattern with Jan peak
// Pattern: Jan=peak, Feb-Mar=declining, Apr-Oct=low baseline, Nov-Dec=rising
// Includes natural year-to-year variation and occasional mini-breakouts
export const ACTUAL_CASES = [
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

// Colors matching app charts
export const COLORS = {
    actual: '#f68000',
    predicted: '#004bbd',
    outerQuantile: '#c4dcf2',
    middleQuantile: '#9bbdff',
    gridLine: '#d5dde5',
};

// Prediction data structure
export interface PredictionData {
    median: number[];
    quantileMidLow: number[];
    quantileMidHigh: number[];
    quantileLow: number[];
    quantileHigh: number[];
}

export interface StepConfig {
    startIndex: number;
    predictions: PredictionData;
}

// Consolidated step configurations
// Step 1: Aug '24 (index 55)
// Step 2: Sep '24 (index 56)
// Step 3: Oct '24 (index 57)
export const STEP_CONFIGS: StepConfig[] = [
    {
        // Aug '24 - predictions for Aug, Sep, Oct '24
        startIndex: 55,
        predictions: {
            median: [16, 18, 22],
            quantileMidLow: [12, 14, 17],
            quantileMidHigh: [20, 22, 28],
            quantileLow: [8, 10, 12],
            quantileHigh: [24, 26, 36],
        },
    },
    {
        // Sep '24 - predictions for Sep, Oct, Nov '24
        startIndex: 56,
        predictions: {
            median: [17, 21, 33],
            quantileMidLow: [14, 18, 28],
            quantileMidHigh: [24, 31, 47],
            quantileLow: [9, 11, 21],
            quantileHigh: [30, 39, 58],
        },
    },
    {
        // Oct '24 - predictions for Oct, Nov, Dec '24
        startIndex: 57,
        predictions: {
            median: [21, 32, 45],
            quantileMidLow: [17, 26, 36],
            quantileMidHigh: [27, 41, 57],
            quantileLow: [7, 14, 20],
            quantileHigh: [38, 60, 85],
        },
    },
];

// Zoom configuration for step 1 - show last 8 months to clearly display quantiles
export const ZOOM_START_INDEX = 52; // May '24
export const ZOOM_END_INDEX = 59; // Dec '24
