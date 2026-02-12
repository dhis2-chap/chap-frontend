import React, { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { FeatureAttribution } from '../../../httpfunctions/services/XaiService';
import styles from './FeatureImportanceChart.module.css';

interface FeatureImportanceChartProps {
    features: FeatureAttribution[];
    title?: string;
    showDirection?: boolean;
}

const formatFeatureName = (name: string): string => {
    return name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const FeatureImportanceChart = ({
    features,
    title,
    showDirection = true,
}: FeatureImportanceChartProps) => {
    const options: Highcharts.Options = useMemo(() => {
        const sortedFeatures = [...features].sort(
            (a, b) => Math.abs(b.importance) - Math.abs(a.importance)
        );

        const categories = sortedFeatures.map((f) => formatFeatureName(f.feature_name));
        const values = sortedFeatures.map((f) => f.importance);

        return {
            chart: {
                type: 'bar',
                height: Math.max(200, features.length * 35 + 80),
            },
            title: {
                text: title || i18n.t('Feature Importance'),
                style: { fontSize: '14px' },
            },
            xAxis: {
                categories,
                title: { text: null },
                labels: {
                    style: { fontSize: '12px' },
                },
            },
            yAxis: {
                title: {
                    text: i18n.t('Importance Score'),
                    style: { fontSize: '12px' },
                },
                labels: {
                    style: { fontSize: '11px' },
                },
            },
            tooltip: {
                formatter: function (this: Highcharts.TooltipFormatterContextObject) {
                    const point = this.point;
                    const feature = sortedFeatures[point.index];
                    let tooltip = `<b>${formatFeatureName(feature.feature_name)}</b><br/>`;
                    tooltip += `${i18n.t('Importance')}: ${feature.importance.toFixed(4)}<br/>`;
                    if (showDirection && feature.direction) {
                        tooltip += `${i18n.t('Effect')}: ${feature.direction}`;
                    }
                    return tooltip;
                },
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true,
                        format: '{y:.3f}',
                        style: { fontSize: '10px' },
                    },
                    colorByPoint: true,
                    colors: values.map((v) =>
                        v >= 0 ? '#4caf50' : '#f44336'
                    ),
                },
            },
            legend: { enabled: false },
            credits: { enabled: false },
            series: [
                {
                    type: 'bar',
                    name: i18n.t('Importance'),
                    data: values,
                },
            ],
        };
    }, [features, title, showDirection]);

    if (!features || features.length === 0) {
        return (
            <div className={styles.empty}>
                {i18n.t('No feature importance data available')}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};
