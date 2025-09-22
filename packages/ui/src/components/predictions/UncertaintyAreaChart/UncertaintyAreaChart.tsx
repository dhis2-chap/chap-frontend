import i18n from '@dhis2/d2-i18n';
import Highcharts from 'highcharts';
import accessibility from 'highcharts/modules/accessibility';
import highchartsMore from 'highcharts/highcharts-more';
import exporting from 'highcharts/modules/exporting';
import React, { useMemo } from 'react';
import HighchartsReact from 'highcharts-react-official';
import { PredictionResponseExtended } from '../../../interfaces/Prediction';
import { createFixedPeriodFromPeriodId } from '@dhis2/multi-calendar-dates';

accessibility(Highcharts);
exporting(Highcharts);
highchartsMore(Highcharts);

const getChartOptions = (
    data: PredictionResponseExtended[],
    predictionTargetName: string,
): Highcharts.Options => {
    const median: Highcharts.PointOptionsObject[] = data
        .filter(d => d.dataElement === 'median')
        .map(d => ({ name: d.period, y: d.value }));

    const highsByPeriod = new Map<string, number>();
    data.forEach((point) => {
        if (point.dataElement === 'quantile_high') {
            highsByPeriod.set(point.period, point.value);
        }
    });

    const range: Highcharts.PointOptionsObject[] = data
        .filter(d => d.dataElement === 'quantile_low')
        .map(d => ({
            name: d.period,
            low: d.value,
            high: highsByPeriod.get(d.period) ?? d.value,
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
                    orgUnitName: data[0]?.displayName ?? '',
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
                zIndex: 2,
            },
            // high
            {
                type: 'arearange',
                name: i18n.t('Range'),
                data: range,
                zIndex: 1,
                lineWidth: 0,
                color: '#004bbd',
                fillOpacity: 0.4,
            },
        ],
    };
};

interface PredicationChartProps {
    data: PredictionResponseExtended[];
    predictionTargetName: string;
}

export const UncertaintyAreaChart = ({
    data,
    predictionTargetName,
}: PredicationChartProps) => {
    const options: Highcharts.Options | undefined = useMemo(() => {
        if (!data || data.length === 0) return undefined;
        return getChartOptions(data, predictionTargetName);
    }, [data, predictionTargetName]);

    return (
        <HighchartsReact
            highcharts={Highcharts}
            constructorType="chart"
            options={options}
        />
    );
};
