import React, { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { FeatureAttribution, DataSourceInfo } from '../../../httpfunctions/services/XaiService';
import styles from './ShapWaterfallChart.module.css';

interface ShapWaterfallChartProps {
    features: FeatureAttribution[];
    baselinePrediction: number;
    actualPrediction: number;
    title?: string;
    topK?: number;
    dataSource?: DataSourceInfo;
}

const formatFeatureName = (name: string): string =>
    name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatValue = (val: number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    if (Number.isInteger(val)) return val.toLocaleString();
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const DATA_SOURCE_LABELS: Record<string, { label: string; color: string }> = {
    observed: { label: 'Current State Driver', color: '#4caf50' },
    seasonal_proxy: { label: 'Seasonal Expectation (Proxy)', color: '#ff9800' },
    last_available: { label: 'Last Available Data', color: '#ff9800' },
};

export const ShapWaterfallChart = ({
    features,
    baselinePrediction,
    actualPrediction,
    title,
    topK = 8,
    dataSource,
}: ShapWaterfallChartProps) => {
    const options: Highcharts.Options = useMemo(() => {
        const sorted = [...features]
            .sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance))
            .slice(0, topK)
            .reverse();

        const displayedSum = sorted.reduce((sum, f) => sum + f.importance, 0);
        const totalSum = features.reduce((sum, f) => sum + f.importance, 0);
        const modelOutput = baselinePrediction + totalSum;
        const otherContribution = totalSum - displayedSum;
        const hasOther = Math.abs(otherContribution) > 0.005;

        const categories: string[] = [
            `E[f(X)] = ${formatValue(baselinePrediction)}`,
            ...sorted.map((f) => {
                const valStr = f.actual_value != null ? ` = ${formatValue(f.actual_value)}` : '';
                return `${formatFeatureName(f.feature_name)}${valStr}`;
            }),
            ...(hasOther ? [i18n.t('Other features')] : []),
            `f(x) = ${formatValue(modelOutput)}`,
        ];

        const data: Highcharts.PointOptionsObject[] = [
            {
                y: baselinePrediction,
                color: '#90A4AE',
                dataLabels: { format: '{y:.1f}' },
            },
            ...sorted.map((f) => ({
                y: f.importance,
                color: f.importance >= 0 ? '#ef5350' : '#42a5f5',
                dataLabels: {
                    format: `{y:+.2f}`,
                },
            })),
            ...(hasOther
                ? [
                      {
                          y: otherContribution,
                          color: otherContribution >= 0 ? '#ef9a9a' : '#90caf9',
                          dataLabels: { format: '{y:+.2f}' },
                      } as Highcharts.PointOptionsObject,
                  ]
                : []),
            {
                isSum: true,
                color: '#546E7A',
                dataLabels: { format: '{y:.1f}' },
            },
        ];

        const chartHeight = Math.max(280, (categories.length) * 44 + 100);

        return {
            chart: {
                type: 'waterfall',
                inverted: true,
                height: chartHeight,
                style: { fontFamily: 'inherit' },
                margin: [50, 80, 60, 200],
            },
            title: {
                text: title || i18n.t('SHAP Feature Contributions'),
                style: { fontSize: '13px', fontWeight: '500' },
                align: 'left' as Highcharts.AlignValue,
            },
            xAxis: {
                categories,
                title: { text: null },
                labels: {
                    style: { fontSize: '11px' },
                    align: 'right' as Highcharts.AlignValue,
                },
            },
            yAxis: {
                title: {
                    text: i18n.t('Model output value'),
                    style: { fontSize: '11px' },
                },
                labels: { style: { fontSize: '11px' } },
                gridLineColor: '#f0f0f0',
                plotLines: [
                    {
                        value: baselinePrediction,
                        color: '#90A4AE',
                        dashStyle: 'Dash' as Highcharts.DashStyleValue,
                        width: 1,
                        zIndex: 3,
                        label: {
                            text: `E[f(X)]`,
                            style: { fontSize: '10px', color: '#90A4AE' },
                        },
                    },
                    ...(Math.abs(actualPrediction - modelOutput) > 0.5
                        ? [
                              {
                                  value: actualPrediction,
                                  color: '#FF9800',
                                  dashStyle: 'Dot' as Highcharts.DashStyleValue,
                                  width: 2,
                                  zIndex: 4,
                                  label: {
                                      text: `${i18n.t('Actual forecast')}: ${formatValue(actualPrediction)}`,
                                      style: { fontSize: '10px', color: '#FF9800', fontWeight: '500' },
                                  },
                              },
                          ]
                        : []),
                ],
            },
            tooltip: {
                formatter: function (this: Highcharts.TooltipFormatterContextObject) {
                    const idx = (this.point as any).index as number;
                    if (idx === 0) {
                        return (
                            `<b>E[f(X)] — ${i18n.t('Average model prediction')}</b><br/>` +
                            `${baselinePrediction.toFixed(2)}`
                        );
                    }
                    if ((this.point as any).isSum) {
                        let tip = `<b>f(x) — ${i18n.t('Model output for this instance')}</b><br/>`;
                        tip += `${modelOutput.toFixed(2)}`;
                        if (Math.abs(actualPrediction - modelOutput) > 0.5) {
                            tip += `<br/><br/>${i18n.t('Actual forecast')}: <b>${actualPrediction.toFixed(2)}</b>`;
                        }
                        return tip;
                    }
                    const otherIdx = sorted.length + 1;
                    if (hasOther && idx === otherIdx) {
                        const sign = otherContribution >= 0 ? '+' : '';
                        return (
                            `<b>${i18n.t('Other features (not shown)')}</b><br/>` +
                            `${sign}${otherContribution.toFixed(2)}`
                        );
                    }
                    const feat = sorted[idx - 1];
                    if (!feat) return '';
                    const sign = feat.importance >= 0 ? '+' : '';
                    let tip = `<b>${formatFeatureName(feat.feature_name)}</b><br/>`;
                    tip += `SHAP value: <b>${sign}${feat.importance.toFixed(3)}</b>`;
                    if (feat.actual_value != null) {
                        tip += `<br/>${i18n.t('Feature value')}: ${formatValue(feat.actual_value)}`;
                    }
                    return tip;
                },
            },
            plotOptions: {
                waterfall: {
                    dataLabels: {
                        enabled: true,
                        style: {
                            fontSize: '10px',
                            fontWeight: 'normal',
                            textOutline: 'none',
                            color: '#444',
                        },
                        inside: false,
                    },
                    lineColor: '#e0e0e0',
                    lineWidth: 1,
                    borderWidth: 0,
                    pointPadding: 0.1,
                },
            },
            legend: { enabled: false },
            credits: { enabled: false },
            series: [
                {
                    type: 'waterfall',
                    name: i18n.t('SHAP Values'),
                    data,
                    upColor: '#ef5350',
                    color: '#42a5f5',
                } as Highcharts.SeriesWaterfallOptions,
            ],
        };
    }, [features, baselinePrediction, actualPrediction, title, topK]);

    if (!features || features.length === 0) {
        return (
            <div className={styles.empty}>
                {i18n.t('No SHAP explanation data available')}
            </div>
        );
    }

    const dsLabel = dataSource
        ? DATA_SOURCE_LABELS[dataSource.dataSourceType] ?? DATA_SOURCE_LABELS.last_available
        : null;

    return (
        <div className={styles.container}>
            {dsLabel && (
                <div className={styles.dataSourceBadge} style={{ borderLeftColor: dsLabel.color }}>
                    <span className={styles.dataSourceLabel} style={{ color: dsLabel.color }}>
                        {dsLabel.label}
                    </span>
                    <span className={styles.dataSourceDesc}>
                        {dataSource!.description}
                    </span>
                </div>
            )}
            <HighchartsReact highcharts={Highcharts} options={options} />
            <p className={styles.annotation}>
                {i18n.t(
                    'Red bars push the prediction higher; blue bars push it lower. ' +
                    'Bar length shows how much each feature contributed to moving away from the average.',
                )}
            </p>
        </div>
    );
};
