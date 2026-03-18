import i18n from '@dhis2/d2-i18n';
import { Button, IconChevronLeft16, IconChevronRight16 } from '@dhis2/ui';
import React, { useCallback, useRef, useState } from 'react';
import styles from './ComparisonPlot.module.css';
import { ResultPlot, ZoomState } from '../ResultPlot/ResultPlot';
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
    const [zoomState, setZoomState] = useState<ZoomState>({
        isZoomed: false,
        canShiftLeft: false,
        canShiftRight: false,
    });

    const setBaseRef = useCallback((chartRef: HighchartsReact.RefObject | null) => {
        baseRef.current = chartRef;
    }, []);

    const setComparisonRef = useCallback((chartRef: HighchartsReact.RefObject | null) => {
        comparisonRef.current = chartRef;
    }, []);

    const shiftZoom = useCallback(
        (direction: 1 | -1) => {
            const chart = baseRef.current?.chart;
            if (!chart) return;

            const axis = chart.xAxis[0];
            const { min, max, dataMin, dataMax } = axis.getExtremes();

            if (min === undefined || max === undefined) return;

            const newMin = min + direction;
            const newMax = max + direction;

            if (newMin < dataMin || newMax > dataMax) return;

            setZoomState({
                isZoomed: true,
                canShiftLeft: newMin > dataMin,
                canShiftRight: newMax < dataMax,
            });

            axis.setExtremes(newMin, newMax, true, false, {
                trigger: 'zoom',
                userMin: newMin,
                userMax: newMax,
            });
        },
        [],
    );

    const resetZoom = useCallback(() => {
        baseRef.current?.chart?.zoomOut();
        comparisonRef.current?.chart?.zoomOut();
        setZoomState({ isZoomed: false, canShiftLeft: false, canShiftRight: false });
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

        chartToSync.redraw(true);
    }, []);

    return (
        <div className={styles.comparionBox}>
            <div className={styles.header}>
                <div className={styles.title}>{orgUnitsData.orgUnitName}</div>
                <div className={`${styles.navigationButtons} ${!zoomState.isZoomed ? styles.hidden : ''}`}>
                    <Button
                        small
                        secondary
                        disabled={!zoomState.canShiftLeft}
                        onClick={() => shiftZoom(-1)}
                        aria-label={i18n.t('Shift zoom left one period')}
                        icon={<IconChevronLeft16 />}
                    />
                    <Button
                        small
                        secondary
                        onClick={resetZoom}
                    >
                        {i18n.t('Reset zoom')}
                    </Button>
                    <Button
                        small
                        secondary
                        disabled={!zoomState.canShiftRight}
                        onClick={() => shiftZoom(1)}
                        aria-label={i18n.t('Shift zoom right one period')}
                        icon={<IconChevronRight16 />}
                    />
                </div>
            </div>
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
                                onZoomStateChange={isBaseEvaluation ? setZoomState : undefined}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
