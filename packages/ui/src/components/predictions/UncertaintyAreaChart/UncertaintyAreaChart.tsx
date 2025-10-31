import i18n from '@dhis2/d2-i18n';
import Highcharts from 'highcharts';
import accessibility from 'highcharts/modules/accessibility';
import highchartsMore from 'highcharts/highcharts-more';
import exporting from 'highcharts/modules/exporting';
import React, { useMemo } from 'react';
import HighchartsReact from 'highcharts-react-official';
import { PredictionOrgUnitSeries } from '../../../interfaces/Prediction';
import { createFixedPeriodFromPeriodId } from '@dhis2/multi-calendar-dates';

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
        },
        xAxis: {
            type: 'category',
            labels: {
                enabled: true,
                formatter: function () {
                    return createFixedPeriodFromPeriodId({
                        periodId: this.value.toString(),
                        calendar: 'gregory',
                    }).displayName;
                },
                style: {
                    fontSize: '0.8rem',
                },
            },
        },
        yAxis: {
            title: {
                text: 'Number of cases',
            },
        },
        credits: {
            text: 'CHAP',
        },
        chart: {
            height: (9 / 16 * 100) + '%',
            marginBottom: 125,
        },
        plotOptions: {
            series: {
                lineWidth: 5,
            },
        },
        series: [
            // median
            {
                type: 'line',
                data: median,
                name: i18n.t('Quantile median'),
                color: '#004bbd',
                zIndex: 3,
            },
            {
                type: 'arearange',
                name: i18n.t('Quantiles Outer'),
                data: outerRange,
                zIndex: 0,
                lineWidth: 0,
                color: '#c4dcf2',
                fillOpacity: 1,
            },
            {
                type: 'arearange',
                name: i18n.t('Quantiles Middle'),
                data: midRange,
                zIndex: 1,
                lineWidth: 0,
                color: '#9bbdff',
                fillOpacity: 1,
            },
        ],
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
