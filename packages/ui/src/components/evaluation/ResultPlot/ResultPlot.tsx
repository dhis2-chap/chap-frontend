import i18n from '@dhis2/d2-i18n';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { HighChartsData } from '../../../interfaces/Evaluation';
import { getPeriodNameFromId } from '../../../utils/Time';
import enableOfflineExporting from 'highcharts/modules/offline-exporting';
import styles from './ResultPlot.module.css';

enableOfflineExporting(Highcharts);

export interface ZoomRange {
    min: number;
    max: number;
    dataMin: number;
    dataMax: number;
}

interface ResultPlotProps {
    data: HighChartsData;
    modelName: string;
    nameLabel?: string;
    syncZoom?: false | Highcharts.AxisSetExtremesEventCallbackFunction;
    maxY?: number;
    zoomRange?: ZoomRange | null;
    onZoomChange?: (range: ZoomRange | null) => void;
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
    onAfterSetExtremes?: Highcharts.AxisSetExtremesEventCallbackFunction;
    nameLabel?: string;
    maxY?: number;
    series: Highcharts.SeriesOptionsType[];
    zoomRange?: ZoomRange | null;
};

const getOptions = ({
    data,
    modelName,
    onAfterSetExtremes,
    nameLabel,
    maxY,
    series,
    zoomRange,
}: GetOptionParams): Highcharts.Options => {
    const subtitleText =
        nameLabel && modelName
            ? `${nameLabel}: ${modelName}`
            : modelName
                ? `Model: ${modelName}`
                : '';

    return {
        title: {
            text: '',
        },
        subtitle: {
            text: subtitleText,
            align: 'left',
        },
        chart: {
            zooming: {
                type: 'x',
                resetButton: { theme: { style: { display: 'none' } } },
            },
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
            events: onAfterSetExtremes
                ? { afterSetExtremes: onAfterSetExtremes }
                : undefined,
            title: {
                text: 'Period',
            },
            crosshair: true,
            zoomEnabled: true,
            min: zoomRange?.min,
            max: zoomRange?.max,
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
>(function ResultPlot({ data, modelName, syncZoom, nameLabel, maxY, zoomRange, onZoomChange }, ref) {
    const internalRef = useRef<HighchartsReact.RefObject | null>(null);

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

    const handleAfterSetExtremes = useCallback(
        function (
            this: Highcharts.Axis,
            event: Highcharts.AxisSetExtremesEventObject,
        ) {
            // Call legacy syncZoom handler if provided
            if (syncZoom) {
                syncZoom.call(this, event);
            }

            if (!onZoomChange || event.trigger !== 'zoom') return;

            const isZoomed =
                event.userMin !== undefined && event.userMax !== undefined;

            if (isZoomed) {
                onZoomChange({
                    min: event.min,
                    max: event.max,
                    dataMin: event.dataMin,
                    dataMax: event.dataMax,
                });
            } else {
                onZoomChange(null);
            }
        },
        [onZoomChange, syncZoom],
    );

    useEffect(() => {
        const chart = internalRef.current?.chart;
        if (!chart) return;

        const axis = chart.xAxis[0];
        if (zoomRange) {
            axis.setExtremes(zoomRange.min, zoomRange.max, true, false);
        } else {
            axis.setExtremes(undefined, undefined, true, false);
        }
    }, [zoomRange]);

    const series = useMemo(() => getSeries(data), [data]);
    const options = useMemo(
        () =>
            getOptions({
                data,
                modelName,
                onAfterSetExtremes: handleAfterSetExtremes,
                nameLabel,
                maxY,
                series,
                zoomRange,
            }),
        [
            data,
            maxY,
            modelName,
            nameLabel,
            series,
            handleAfterSetExtremes,
            zoomRange,
        ],
    );

    return (
        <div className={styles.wrapper}>
            <HighchartsReact
                ref={setRefs}
                highcharts={Highcharts}
                options={options}
            />
        </div>
    );
});

ResultPlotBase.displayName = 'ResultPlot';

export const ResultPlot = React.memo(ResultPlotBase);
