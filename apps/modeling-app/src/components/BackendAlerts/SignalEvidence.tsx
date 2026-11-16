import { useMemo } from 'react';
import {
    getStableMaxYForThresholdChart,
    UncertaintyAreaChart,
    type PredictionOrgUnitSeries,
    type ThresholdChartLine,
} from '@dhis2-chap/ui';
import { AlertLevelTag } from './AlertLevelTag';
import { getAlertPeriods, type DisplayedPredictionAlert } from './displayPredictionAlerts';
import styles from './BackendAlerts.module.css';

type Props = {
    // The signals raised in one organisation unit.
    alerts: DisplayedPredictionAlert[];
    predictionTargetName: string;
    series?: PredictionOrgUnitSeries;
    thresholdLines?: ThresholdChartLine[];
};

// What a reviewer needs to judge an organisation unit's signals: each level's response action and the forecast they were raised from.
export const SignalEvidence = ({ alerts, predictionTargetName, series, thresholdLines }: Props) => {
    const alertPeriods = useMemo(() => getAlertPeriods(alerts), [alerts]);
    const maxY = useMemo(() => (
        series ? getStableMaxYForThresholdChart(series, thresholdLines?.flatMap(line => line.points) ?? null) : undefined
    ), [series, thresholdLines]);
    // Signals over several periods share their level's action, so it is listed once per level.
    const responseActions = [...new Map(alerts.filter(alert => alert.responseAction).map(alert => [alert.level, alert])).values()];

    return (
        <div className={styles.form}>
            {responseActions.map(alert => (
                <div key={alert.level} className={styles.levelTag}>
                    <AlertLevelTag display={alert.display} />
                    <span className={styles.responseAction}>{alert.responseAction}</span>
                </div>
            ))}
            {series && (
                <UncertaintyAreaChart
                    predictionTargetName={predictionTargetName}
                    series={series}
                    alertPeriods={alertPeriods}
                    thresholdLines={thresholdLines}
                    variant="tile"
                    maxY={maxY}
                />
            )}
        </div>
    );
};
