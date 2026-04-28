import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import Highcharts from 'highcharts';
import accessibility from 'highcharts/modules/accessibility';
import highchartsMore from 'highcharts/highcharts-more';
import exporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';
import { PredictionOrgUnitSeries } from '../../../interfaces/Prediction';
import type { SupportedOutbreakProbabilityBucket } from '../../../utils/outbreakAlerts';

accessibility(Highcharts);
exporting(Highcharts);
highchartsMore(Highcharts);

const getChartOptions = (
    series: PredictionOrgUnitSeries,
    predictionTargetName: string,
    endemicThreshold?: number | null,
    outbreakPeriods: OutbreakPeriodChartInfo[] = [],
): Highcharts.Options => {
    const periods = [
        ...(series.actualCases?.map(actualCase => actualCase.period) ?? []),
        ...series.points.map(point => point.period),
    ].filter((period, index, allPeriods) => allPeriods.indexOf(period) === index);
    const periodIndexById = new Map(periods.map((period, index) => [period, index]));
    const outbreakInfoByPeriod = new Map(
        outbreakPeriods.map(outbreakPeriod => [outbreakPeriod.period, outbreakPeriod]),
    );
    const median: Highcharts.PointOptionsObject[] = series.points
        .map(p => ({ name: p.period, x: periodIndexById.get(p.period), y: p.quantiles.median }));

    const outerRange: Highcharts.PointOptionsObject[] = series.points
        .map(p => ({
            name: p.period,
            x: periodIndexById.get(p.period),
            low: p.quantiles.quantile_low,
            high: p.quantiles.quantile_high,
        }));

    const midRange: Highcharts.PointOptionsObject[] = series.points
        .map(p => ({
            name: p.period,
            x: periodIndexById.get(p.period),
            low: p.quantiles.quantile_mid_low,
            high: p.quantiles.quantile_mid_high,
        }));

    const actualCases: Highcharts.PointOptionsObject[] | undefined = series.actualCases
        ?.map(ac => ({ name: ac.period, x: periodIndexById.get(ac.period), y: ac.value }));

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

    if (endemicThreshold !== undefined && endemicThreshold !== null) {
        chartSeries.push({
            type: 'line',
            data: periods.map(period => ({
                name: period,
                x: periodIndexById.get(period),
                y: endemicThreshold,
            })),
            name: i18n.t('Endemic threshold'),
            color: '#212934',
            dashStyle: 'Dash',
            zIndex: 5,
            marker: {
                enabled: false,
            },
            lineWidth: 2,
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
            formatter: function () {
                const points = this.points ?? [];
                const lines = points.map(point => (
                    `<span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${point.y?.toFixed(2)}</b>`
                ));
                const period = String(points[0]?.point.name ?? this.x);
                const outbreakInfo = outbreakInfoByPeriod.get(period);

                if (outbreakInfo) {
                    lines.push(
                        `${i18n.t('Outbreak')}: <b>${outbreakInfo.outbreak ? i18n.t('Yes') : i18n.t('No')}</b>`,
                        `${i18n.t('Supported probability')}: <b>${formatProbabilityBucket(outbreakInfo.supportedProbability)}</b>`,
                        `${i18n.t('Imported value')}: <b>${outbreakInfo.value}</b>`,
                    );
                }

                return `<b>${period}</b><br/>${lines.join('<br/>')}`;
            },
        },
        xAxis: {
            type: 'category',
            categories: periods,
            labels: {
                enabled: true,
                formatter: function () {
                    return this.value.toString();
                },
                style: {
                    fontSize: '0.8rem',
                },
            },
            plotBands: outbreakPeriods
                .filter(outbreakPeriod => outbreakPeriod.outbreak)
                .map((outbreakPeriod) => {
                    const index = periodIndexById.get(outbreakPeriod.period);

                    return {
                        from: (index ?? 0) - 0.5,
                        to: (index ?? 0) + 0.5,
                        color: 'rgba(212, 64, 64, 0.16)',
                    };
                }),
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
    endemicThreshold?: number | null;
    outbreakPeriods?: OutbreakPeriodChartInfo[];
}

export interface OutbreakPeriodChartInfo {
    period: string;
    outbreak: boolean;
    supportedProbability: SupportedOutbreakProbabilityBucket;
    value: '1' | '0';
}

const formatProbabilityBucket = (
    bucket: SupportedOutbreakProbabilityBucket,
) => (bucket === '<10' ? bucket : `>=${bucket}%`);

export const UncertaintyAreaChart = ({
    series,
    predictionTargetName,
    endemicThreshold,
    outbreakPeriods = [],
}: PredicationChartProps) => {
    const options: Highcharts.Options | undefined = useMemo(() => {
        if (!series || series.points.length === 0) return undefined;
        return getChartOptions(
            series,
            predictionTargetName,
            endemicThreshold,
            outbreakPeriods,
        );
    }, [series, predictionTargetName, endemicThreshold, outbreakPeriods]);

    return (
        <HighchartsReact
            highcharts={Highcharts}
            constructorType="chart"
            options={options}
        />
    );
};
