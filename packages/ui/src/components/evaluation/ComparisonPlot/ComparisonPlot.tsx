import React, { useCallback, useRef } from 'react';
import styles from './ComparisonPlot.module.css';
import { ResultPlot } from '../ResultPlot/ResultPlot';
import { EvaluationPerOrgUnit } from '../../../interfaces/Evaluation';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
interface SideBySidePlotsProps {
    orgUnitsData: EvaluationPerOrgUnit;
    nameLabel?: string;
    maxY?: number;
}

export const ComparisonPlot = React.memo(function ComparisonPlot({
    orgUnitsData,
    nameLabel,
    maxY,
}: SideBySidePlotsProps) {
    const baseRef = useRef<HighchartsReact.RefObject | null>(null);
    const comparisonRef = useRef<HighchartsReact.RefObject | null>(null);

    const setBaseRef = useCallback((chartRef: HighchartsReact.RefObject | null) => {
        baseRef.current = chartRef;
    }, []);

    const setComparisonRef = useCallback((chartRef: HighchartsReact.RefObject | null) => {
        comparisonRef.current = chartRef;
    }, []);

    const handleSyncChartZoom = useCallback(function handleSyncChartZoom(
        this: Highcharts.Axis,
        event: Highcharts.AxisSetExtremesEventObject,
    ): void {
        if (event.trigger !== 'zoom') {
            // prevent multiple calls from other charts
            return;
        }
        const triggeringChart = this.chart;
        const chartToSync =
            baseRef.current !== null && triggeringChart === baseRef.current?.chart
                ? comparisonRef.current?.chart
                : baseRef.current?.chart;

        if (!chartToSync) {
            return;
        }

        const isReset =
            event.userMax === undefined && event.userMin === undefined;

        if (isReset) {
            chartToSync.zoomOut();
            triggeringChart.zoomOut();
            return;
        }
        const { min: xMin, max: xMax } = event;

        // sync x-axis zoom while the shared max keeps the y-axis stable.
        chartToSync.xAxis[0].setExtremes(xMin, xMax, false);

        // handle reset zoom button
        const extremes = chartToSync.xAxis[0].getExtremes();
        const wasZooming =
            extremes.userMax !== undefined && extremes.userMin !== undefined;

        if (!wasZooming) {
            // only show reset zoom if we were not zooming before
            // if this is called multiple times, the button wont disappear
            // when zooming out
            chartToSync.showResetZoom();
        }
        chartToSync.redraw(true);
    }, []);

    return (
        <div className={styles.comparionBox}>
            <div className={styles.title}>{orgUnitsData.orgUnitName}</div>
            <div className={styles.comparionBoxSideBySide}>
                {orgUnitsData.models.map((modelData, index) => {
                    const isBaseEvaluation = index === 0;
                    return (
                        <div
                            key={`${orgUnitsData.orgUnitId}-${modelData.modelName}-${index}`}
                            className={styles.comparionBoxSideBySideItem}
                        >
                            <ResultPlot
                                syncZoom={
                                    orgUnitsData.models.length > 1
                                        ? handleSyncChartZoom
                                        : false
                                }
                                data={modelData.data}
                                modelName={modelData.modelName}
                                nameLabel={nameLabel}
                                ref={
                                    isBaseEvaluation
                                        ? setBaseRef
                                        : setComparisonRef
                                }
                                maxY={maxY}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
