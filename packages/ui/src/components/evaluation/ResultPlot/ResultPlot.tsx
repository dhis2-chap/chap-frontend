import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'
import React from 'react'
import { HighChartsData } from '../../../interfaces/Evaluation'
import { getPeriodNameFromId } from '../../../utils/Time'
import enableOfflineExporting from 'highcharts/modules/offline-exporting'

enableOfflineExporting(Highcharts)

function syncChartZoom(
    this: Highcharts.Axis,
    event: Highcharts.AxisSetExtremesEventObject
): void {
    Highcharts.charts.forEach((chart) => {
        if (chart) {
            chart.xAxis[0].setExtremes(event.min, event.max)
        }
    })
}

interface ResultPlotProps {
    data: HighChartsData
    modelName: string
    nameLabel?: string
    syncZoom: boolean | Highcharts.AxisSetExtremesEventCallbackFunction
    ref?: HighchartsReact.RefObject
    maxY?: number
}

const getSeries = (data: any): Highcharts.SeriesOptionsType[] => {
    return [
        {
            name: 'Real Cases',
            data: data.realValues,
            zIndex: 4,
            lineWidth: 2.5,
            type: 'line',
            color: '#f68000', // Different color for real data
            marker: {
                enabled: false,
                lineWidth: 2,
                //fillColor: Highcharts.getOptions().colors[2]
            },
        },
        {
            name: 'Predicted Cases',
            type: 'line',
            color: '#004bbd',
            data: data.averages.slice(),
            zIndex: 3,
            opacity: 1,
            lineWidth: 2.5,
            marker: {
                enabled: false,
            },
        },
        {
            name: 'Quantiles Outer',
            data: data.ranges.slice(),
            type: 'arearange',
            lineWidth: 0,
            color: '#c4dcf2',
            fillOpacity: 1,
            zIndex: 0,
            marker: {
                enabled: false,
            },
        },
        {
            name: 'Quantiles Middle',
            data: data.midranges.slice(),
            type: 'arearange',
            lineWidth: 1,
            color: '#9bbdff',
            fillOpacity: 1,
            zIndex: 1,
            marker: {
                enabled: false,
            },
        },
    ]
}

type GetOptionParams = {
    data: any
    modelName: string
    syncZoom: ResultPlotProps['syncZoom']
    nameLabel?: string
    maxY?: number
}

const getOptions = ({
    data,
    modelName,
    syncZoom,
    nameLabel,
    maxY,
}: GetOptionParams): Highcharts.Options => {
    const subtitleText =
        nameLabel && modelName
            ? `${nameLabel}: ${modelName}`
            : modelName
            ? `Model: ${modelName}`
            : ''
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
                    this: Highcharts.AxisLabelsFormatterContextObject
                ): string {
                    return getPeriodNameFromId(this.value.toString())
                },
                style: {
                    fontSize: '0.9rem',
                },
            },
            events: syncZoom
                ? {
                      afterSetExtremes:
                          typeof syncZoom === 'function'
                              ? syncZoom
                              : syncChartZoom,
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
            max: maxY || undefined,
        },
        tooltip: {
            shared: true,
            valueSuffix: ' cases',
        },
        plotOptions: {
            series: {
                animation: {
                    duration: 0,
                },
            },
        },
        series: getSeries(data),
        exporting: {
            fallbackToExportServer: false,
        },
    }
}

export const ResultPlot = React.forwardRef<
    HighchartsReact.RefObject,
    ResultPlotProps
>(function ResultPlot({ data, modelName, syncZoom, nameLabel, maxY }, ref) {
    return (
        <>
            <HighchartsReact
                ref={ref}
                highcharts={Highcharts}
                options={getOptions({
                    data,
                    modelName,
                    syncZoom,
                    nameLabel,
                    maxY,
                })}
            />
        </>
    )
})
