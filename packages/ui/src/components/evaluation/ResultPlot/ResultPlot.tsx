import i18n from '@dhis2/d2-i18n';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { HighChartsData } from '../../../interfaces/Evaluation';
import { getPeriodNameFromId } from '../../../utils/Time';
import enableOfflineExporting from 'highcharts/modules/offline-exporting';
import styles from './ResultPlot.module.css';

enableOfflineExporting(Highcharts);

interface ResultPlotProps {
    data: HighChartsData;
    modelName: string;
    nameLabel?: string;
    syncZoom: false | Highcharts.AxisSetExtremesEventCallbackFunction;
    maxY?: number;
}

const getSeries = (data: HighChartsData): Highcharts.SeriesOptionsType[] => {
    return [
        {
            name: 'Real Cases',
            data: data.realValues,
            zIndex: 4,
            lineWidth: 2.5,
            type: 'line',
            color: '#f68000', // Different color for real data
            connectNulls: false,
            marker: {
                enabled: false,
                lineWidth: 2,
                // fillColor: Highcharts.getOptions().colors[2]
            },
        },
        {
            name: i18n.t('Median prediction'),
            type: 'line',
            color: '#004bbd',
            data: data.averages.slice(),
            zIndex: 3,
            opacity: 1,
            lineWidth: 2.5,
            connectNulls: false,
            marker: {
                enabled: false,
            },
        },
        {
            name: i18n.t('80% prediction interval'),
            data: data.ranges.slice(),
            type: 'arearange',
            lineWidth: 0,
            color: '#c4dcf2',
            fillOpacity: 1,
            zIndex: 0,
            connectNulls: false,
            marker: {
                enabled: false,
            },
        },
        {
            name: i18n.t('50% prediction interval'),
            data: data.midranges?.slice() ?? [],
            type: 'arearange',
            lineWidth: 1,
            color: '#9bbdff',
            fillOpacity: 1,
            zIndex: 1,
            connectNulls: false,
            marker: {
                enabled: false,
            },
        },
    ] as Highcharts.SeriesOptionsType[];
};

type GetOptionParams = {
    data: HighChartsData;
    modelName: string;
    syncZoom: ResultPlotProps['syncZoom'];
    onAfterSetExtremes?: Highcharts.AxisSetExtremesEventCallbackFunction;
    nameLabel?: string;
    maxY?: number;
    series: Highcharts.SeriesOptionsType[];
};

const getOptions = ({
    data,
    modelName,
    syncZoom,
    onAfterSetExtremes,
    nameLabel,
    maxY,
    series,
}: GetOptionParams): Highcharts.Options => {
    const subtitleText =
        nameLabel && modelName
            ? `${nameLabel}: ${modelName}`
            : modelName
                ? `Model: ${modelName}`
                : '';
    const buildAfterSetExtremes = ():
        | Highcharts.AxisSetExtremesEventCallbackFunction
        | undefined => {
        const syncHandler = syncZoom || undefined;

        if (!syncHandler && !onAfterSetExtremes) {
            return undefined;
        }

        return function (
            this: Highcharts.Axis,
            event: Highcharts.AxisSetExtremesEventObject,
        ) {
            if (onAfterSetExtremes) {
                onAfterSetExtremes.call(this, event);
            }
            if (syncHandler) {
                syncHandler.call(this, event);
            }
        };
    };

    const afterSetExtremes = buildAfterSetExtremes();

    return {
        title: {
            text: '',
        },
        subtitle: {
            text: subtitleText,
            align: 'left',
        },
        chart: {
            zooming: { type: 'x' },
        },
        xAxis: {
            categories: data.periods, // Use periods as categories
            labels: {
                enabled: true,
                formatter: function (
                    this: Highcharts.AxisLabelsFormatterContextObject,
                ): string {
                    return getPeriodNameFromId(this.value.toString());
                },
                style: {
                    fontSize: '0.9rem',
                },
            },
            events: afterSetExtremes
                ? { afterSetExtremes }
                : undefined,
            title: {
                text: 'Period',
            },
            crosshair: true,
            zoomEnabled: true,
        },
        yAxis: {
            title: {
                text: null,
            },
            min: 0,
            zoomEnabled: false,
            max: maxY ?? undefined,
        },
        tooltip: {
            shared: true,
            valueSuffix: ' cases',
            valueDecimals: 2,
        },
        plotOptions: {
            series: {
                animation: {
                    duration: 0,
                },
            },
        },
        series,
        exporting: {
            fallbackToExportServer: false,
        },
    };
};

const ResultPlotBase = React.forwardRef<
    HighchartsReact.RefObject,
    ResultPlotProps
>(function ResultPlot({ data, modelName, syncZoom, nameLabel, maxY }, ref) {
    const internalRef = useRef<HighchartsReact.RefObject | null>(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [canShiftLeft, setCanShiftLeft] = useState(false);
    const [canShiftRight, setCanShiftRight] = useState(false);

    const setRefs = useCallback(
        (instance: HighchartsReact.RefObject | null) => {
            internalRef.current = instance;
            if (typeof ref === 'function') {
                ref(instance);
            } else if (ref) {
                (
                    ref as React.MutableRefObject<HighchartsReact.RefObject | null>
                ).current = instance;
            }
        },
        [ref],
    );

    const updateZoomState = useCallback(
        function (
            this: Highcharts.Axis,
            event: Highcharts.AxisSetExtremesEventObject,
        ) {
            const zoomed =
                event.userMin !== undefined && event.userMax !== undefined;
            setIsZoomed(zoomed);
            if (zoomed) {
                setCanShiftLeft(event.min > event.dataMin);
                setCanShiftRight(event.max < event.dataMax);
            }
        },
        [],
    );

    const shiftZoom = useCallback(
        (direction: 1 | -1) => {
            const chart = internalRef.current?.chart;
            if (!chart) return;

            const axis = chart.xAxis[0];
            const { min, max, dataMin, dataMax } = axis.getExtremes();

            if (min === undefined || max === undefined) return;

            const newMin = min + direction;
            const newMax = max + direction;

            if (newMin < dataMin || newMax > dataMax) return;

            setCanShiftLeft(newMin > dataMin);
            setCanShiftRight(newMax < dataMax);

            axis.setExtremes(newMin, newMax, true, false, {
                trigger: 'zoom',
                userMin: newMin,
                userMax: newMax,
            });
        },
        [],
    );

    const series = useMemo(() => getSeries(data), [data]);
    const options = useMemo(
        () =>
            getOptions({
                data,
                modelName,
                syncZoom,
                onAfterSetExtremes: updateZoomState,
                nameLabel,
                maxY,
                series,
            }),
        [
            data,
            maxY,
            modelName,
            nameLabel,
            series,
            syncZoom,
            updateZoomState,
        ],
    );

    return (
        <div className={styles.wrapper}>
            <HighchartsReact
                ref={setRefs}
                highcharts={Highcharts}
                options={options}
            />
            {isZoomed && (
                <div className={styles.navigationButtons}>
                    <button
                        className={styles.navButton}
                        onClick={() => shiftZoom(-1)}
                        disabled={!canShiftLeft}
                        title={i18n.t('Shift zoom left one period')}
                        aria-label={i18n.t('Shift zoom left one period')}
                    >
                        &#x2039;
                    </button>
                    <button
                        className={styles.navButton}
                        onClick={() => shiftZoom(1)}
                        disabled={!canShiftRight}
                        title={i18n.t('Shift zoom right one period')}
                        aria-label={i18n.t('Shift zoom right one period')}
                    >
                        &#x203A;
                    </button>
                </div>
            )}
        </div>
    );
});

ResultPlotBase.displayName = 'ResultPlot';

export const ResultPlot = React.memo(ResultPlotBase);
