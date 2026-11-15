import { useMemo } from 'react';
import {
    getStableMaxYForThresholdChart,
    UncertaintyAreaChart,
    type PredictionOrgUnitSeries,
    type ThresholdChartLine,
} from '@dhis2-chap/ui';
import { getAlertPeriods, type DisplayedPredictionAlert } from './displayPredictionAlerts';

type Props = {
    // The signals raised in one organisation unit.
    alerts: DisplayedPredictionAlert[];
    predictionTargetName: string;
    series?: PredictionOrgUnitSeries;
    thresholdLines?: ThresholdChartLine[];
};

// What a reviewer needs to judge an organisation unit's signals: the forecast they were raised from.
export const SignalEvidence = ({ alerts, predictionTargetName, series, thresholdLines }: Props) => {
    const alertPeriods = useMemo(() => getAlertPeriods(alerts), [alerts]);
    const maxY = useMemo(() => (
        series ? getStableMaxYForThresholdChart(series, thresholdLines?.flatMap(line => line.points) ?? null) : undefined
    ), [series, thresholdLines]);

    if (!series) return null;

    return (
        <UncertaintyAreaChart
            predictionTargetName={predictionTargetName}
            series={series}
            alertPeriods={alertPeriods}
            thresholdLines={thresholdLines}
            variant="tile"
            maxY={maxY}
        />
    );
};
