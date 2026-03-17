import i18n from '@dhis2/d2-i18n';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import React, { useMemo } from 'react';
import { HighChartsData } from '../../../interfaces/Evaluation';
import { getPeriodNameFromId } from '../../../utils/Time';
import enableOfflineExporting from 'highcharts/modules/offline-exporting';

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
    nameLabel?: string;
    maxY?: number;
    series: Highcharts.SeriesOptionsType[];
};

const getOptions = ({
    data,
    modelName,
    syncZoom,
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
            events: syncZoom
                ? {
                        afterSetExtremes: syncZoom,
                    }
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
    const series = useMemo(() => getSeries(data), [data]);
    const options = useMemo(
        () =>
            getOptions({
                data,
                modelName,
                syncZoom,
                nameLabel,
                maxY,
                series,
            }),
        [data, maxY, modelName, nameLabel, series, syncZoom],
    );

    return (
        <HighchartsReact
            ref={ref}
            highcharts={Highcharts}
            options={options}
        />
    );
});

ResultPlotBase.displayName = 'ResultPlot';

export const ResultPlot = React.memo(ResultPlotBase);
