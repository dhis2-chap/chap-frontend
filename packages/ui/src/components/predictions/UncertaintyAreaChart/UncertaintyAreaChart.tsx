import React, { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import Highcharts from 'highcharts';
import accessibility from 'highcharts/modules/accessibility';
import highchartsMore from 'highcharts/highcharts-more';
import exporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';
import { PredictionOrgUnitSeries } from '../../../interfaces/Prediction';

accessibility(Highcharts);
exporting(Highcharts);
highchartsMore(Highcharts);

const getChartOptions = (
    series: PredictionOrgUnitSeries,
    predictionTargetName: string,
): Highcharts.Options => {
    const median: Highcharts.PointOptionsObject[] = series.points
        .map(p => ({ name: p.period, y: p.quantiles.median }));

    const outerRange: Highcharts.PointOptionsObject[] = series.points
        .map(p => ({
            name: p.period,
            low: p.quantiles.quantile_low,
            high: p.quantiles.quantile_high,
        }));

    const midRange: Highcharts.PointOptionsObject[] = series.points
        .map(p => ({
            name: p.period,
            low: p.quantiles.quantile_mid_low,
            high: p.quantiles.quantile_mid_high,
        }));

    const actualCases: Highcharts.PointOptionsObject[] | undefined = series.actualCases
        ?.map(ac => ({ name: ac.period, y: ac.value }));

    const chartSeries: Highcharts.SeriesOptionsType[] = [
        // median
        {
            type: 'line',
            data: median,
            name: i18n.t('Median prediction'),
            color: '#004bbd',
            zIndex: 3,
            connectNulls: false,
        },
        {
            type: 'arearange',
            name: i18n.t('80% prediction interval'),
            data: outerRange,
            zIndex: 0,
            lineWidth: 0,
            color: '#c4dcf2',
            fillOpacity: 1,
            connectNulls: false,
        },
        {
            type: 'arearange',
            name: i18n.t('50% prediction interval'),
            data: midRange,
            zIndex: 1,
            lineWidth: 0,
            color: '#9bbdff',
            fillOpacity: 1,
            connectNulls: false,
        },
    ];

    if (actualCases && actualCases.length > 0) {
        chartSeries.unshift({
            type: 'line',
            data: actualCases,
            name: i18n.t('Actual Cases'),
            color: '#f68000',
            zIndex: 4,
            marker: {
                enabled: false,
            },
            lineWidth: 2.5,
            connectNulls: false,
        });
    }

    return {
        title: {
            style: {
                fontSize: '0.8rem',
            },
            text: i18n.t(
                'Prediction for {{predictionTargetName}} for {{orgUnitName}}',
                {
                    predictionTargetName,
                    orgUnitName: series.orgUnitName ?? '',
                },
            ),
        },
        tooltip: {
            shared: true,
            valueDecimals: 2,
        },
        xAxis: {
            type: 'category',
            labels: {
                enabled: true,
                formatter: function () {
                    return this.value.toString();
                },
                style: {
                    fontSize: '0.8rem',
                },
            },
        },
        yAxis: {
            title: {
                text: i18n.t('Number of cases'),
            },
        },
        credits: {
            text: 'CHAP',
        },
        chart: {
            height: (9 / 16 * 100) + '%',
            marginBottom: 125,
            zooming: { type: 'x' },
        },
        plotOptions: {
            series: {
                lineWidth: 5,
            },
        },
        series: chartSeries,
    };
};

interface PredicationChartProps {
    series: PredictionOrgUnitSeries;
    predictionTargetName: string;
}

export const UncertaintyAreaChart = ({
    series,
    predictionTargetName,
}: PredicationChartProps) => {
    const options: Highcharts.Options | undefined = useMemo(() => {
        if (!series || series.points.length === 0) return undefined;
        return getChartOptions(series, predictionTargetName);
    }, [series, predictionTargetName]);

    return (
        <HighchartsReact
            highcharts={Highcharts}
            constructorType="chart"
            options={options}
        />
    );
};
