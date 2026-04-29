import { useCallback, useEffect, useMemo, useRef } from 'react';
import i18n from '@dhis2/d2-i18n';
import Highcharts from 'highcharts';
import accessibility from 'highcharts/modules/accessibility';
import highchartsMore from 'highcharts/highcharts-more';
import exporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';
import { PredictionOrgUnitSeries } from '../../../interfaces/Prediction';
import type { SupportedOutbreakProbabilityBucket } from '../../../utils/outbreakAlerts';
import type { ZoomRange } from '../../evaluation/ResultPlot/ResultPlot';

accessibility(Highcharts);
exporting(Highcharts);
highchartsMore(Highcharts);

type DisabledAnimationOptions = {
    chart: {
        animation: false;
    };
    plotOptions: {
        series: {
            animation: false;
        };
    };
};

const getDisabledAnimationOptions = (): DisabledAnimationOptions => ({
    chart: {
        animation: false,
    },
    plotOptions: {
        series: {
            animation: false,
        },
    },
});

const getChartOptions = (
    series: PredictionOrgUnitSeries,
    predictionTargetName: string,
    endemicThreshold?: number | null,
    outbreakPeriods: OutbreakPeriodChartInfo[] = [],
    variant: UncertaintyAreaChartVariant = 'default',
    onAfterSetExtremes?: Highcharts.AxisSetExtremesEventCallbackFunction,
    hideResetButton = false,
): Highcharts.Options => {
    const isTile = variant === 'tile';
    const disabledAnimationOptions = getDisabledAnimationOptions();
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
            text: isTile ? undefined : i18n.t(
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
                    );
                }

                return `<b>${period}</b><br/>${lines.join('<br/>')}`;
            },
        },
        xAxis: {
            type: 'category',
            categories: periods,
            events: onAfterSetExtremes
                ? { afterSetExtremes: onAfterSetExtremes }
                : undefined,
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
                text: isTile ? undefined : i18n.t('Number of cases'),
            },
        },
        credits: {
            enabled: !isTile,
            text: 'CHAP',
        },
        exporting: {
            enabled: !isTile,
        },
        legend: {
            enabled: !isTile,
        },
        chart: {
            ...disabledAnimationOptions.chart,
            height: isTile ? 240 : (9 / 16 * 100) + '%',
            marginBottom: isTile ? 48 : 125,
            zooming: {
                type: 'x',
                ...(hideResetButton && {
                    resetButton: { theme: { style: { display: 'none' } } },
                }),
            },
        },
        plotOptions: {
            ...disabledAnimationOptions.plotOptions,
            series: {
                ...disabledAnimationOptions.plotOptions.series,
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
    variant?: UncertaintyAreaChartVariant;
    zoomRange?: ZoomRange | null;
    onZoomChange?: (range: ZoomRange | null) => void;
}

export interface OutbreakPeriodChartInfo {
    period: string;
    outbreak: boolean;
    supportedProbability: SupportedOutbreakProbabilityBucket;
    value: '1' | '0';
}

export type UncertaintyAreaChartVariant = 'default' | 'tile';

export const UncertaintyAreaChart = ({
    series,
    predictionTargetName,
    endemicThreshold,
    outbreakPeriods = [],
    variant = 'default',
    zoomRange,
    onZoomChange,
}: PredicationChartProps) => {
    const chartRef = useRef<HighchartsReact.RefObject | null>(null);

    const handleAfterSetExtremes = useCallback(
        function (
            this: Highcharts.Axis,
            event: Highcharts.AxisSetExtremesEventObject,
        ) {
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
        [onZoomChange],
    );

    useEffect(() => {
        const chart = chartRef.current?.chart;
        if (!chart) return;

        const axis = chart.xAxis[0];
        if (zoomRange) {
            axis.setExtremes(zoomRange.min, zoomRange.max, true, false);
        } else {
            axis.setExtremes(undefined, undefined, true, false);
        }
    }, [zoomRange]);

    const hasExternalZoomControls = onZoomChange !== undefined;
    const options: Highcharts.Options | undefined = useMemo(() => {
        if (!series || series.points.length === 0) return undefined;
        return getChartOptions(
            series,
            predictionTargetName,
            endemicThreshold,
            outbreakPeriods,
            variant,
            handleAfterSetExtremes,
            hasExternalZoomControls,
        );
    }, [
        series,
        predictionTargetName,
        endemicThreshold,
        outbreakPeriods,
        variant,
        handleAfterSetExtremes,
        hasExternalZoomControls,
    ]);

    return (
        <HighchartsReact
            ref={chartRef}
            highcharts={Highcharts}
            constructorType="chart"
            options={options}
        />
    );
};
