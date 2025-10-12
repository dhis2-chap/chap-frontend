import React, { useState } from 'react';
import styles from './ComparisonPlot.module.css';
import { ResultPlot } from '../ResultPlot/ResultPlot';
import { EvaluationPerOrgUnit } from '../../../interfaces/Evaluation';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
interface SideBySidePlotsProps {
    orgUnitsData: EvaluationPerOrgUnit;
    nameLabel?: string;
}

export const ComparisonPlot = React.memo(function ComparisonPlot({
    orgUnitsData,
    nameLabel,
}: SideBySidePlotsProps) {
    // read during render, so we should store in state over useRef
    const [baseRef, setBaseRef] = useState<HighchartsReact.RefObject | null>(
        null,
    );
    const [comparisonRef, setComparisonRef] =
        useState<HighchartsReact.RefObject | null>(null);

    function handleSyncChartZoom(
        this: Highcharts.Axis,
        event: Highcharts.AxisSetExtremesEventObject,
    ): void {
        if (event.trigger !== 'zoom') {
            // prevent multiple calls from other charts
            return;
        }
        const triggeringChart = this.chart;
        const chartToSync =
            baseRef !== null && triggeringChart === baseRef?.chart
                ? comparisonRef?.chart
                : baseRef?.chart;

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
        const triggeringYAxis = this.chart.yAxis[0];
        const { min: xMin, max: xMax } = event;
        const { min: yMin, max: yMax } = triggeringYAxis;
        // sync zoom for both axes
        chartToSync.yAxis[0].setExtremes(yMin, yMax, false);
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
    }
    return (
        <div className={styles.comparionBox}>
            <div className={styles.title}>{orgUnitsData.orgUnitName}</div>
            <div className={styles.comparionBoxSideBySide}>
                {orgUnitsData.models.map((modelData, index) => {
                    const isBaseEvaluation = index === 0;
                    return (
                        <div
                            key={index}
                            className={styles.comparionBoxSideBySideItem}
                        >
                            <ResultPlot
                                syncZoom={
                                    orgUnitsData.models.length > 0 &&
                                    handleSyncChartZoom
                                }
                                data={modelData.data}
                                modelName={modelData.modelName}
                                nameLabel={nameLabel}
                                ref={
                                    isBaseEvaluation
                                        ? setBaseRef
                                        : setComparisonRef
                                }
                                maxY={
                                    !isBaseEvaluation
                                        ? baseRef?.chart?.yAxis[0].max
                                        : undefined
                                }
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
