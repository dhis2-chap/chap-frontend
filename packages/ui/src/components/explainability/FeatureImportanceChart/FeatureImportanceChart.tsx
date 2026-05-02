import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { FeatureAttribution } from '../../../services/xai/XaiService';
import { formatFeatureName, CHART_COLORS } from '../utils';
import styles from './FeatureImportanceChart.module.css';

interface FeatureImportanceChartProps {
    features: FeatureAttribution[];
    title?: string;
    height?: number;
}

export const FeatureImportanceChart = ({
    features,
    title,
    height,
}: FeatureImportanceChartProps) => {
    const options: Highcharts.Options = useMemo(() => {
        const sortedFeatures = [...features].sort(
            (a, b) => Math.abs(b.importance) - Math.abs(a.importance),
        );

        const categories = sortedFeatures.map(f => formatFeatureName(f.featureName));
        const values = sortedFeatures.map(f => Math.abs(f.importance));

        return {
            chart: {
                type: 'bar',
                height: height ?? Math.max(200, features.length * 35 + 80),
            },
            title: {
                text: title || i18n.t('Feature Importance'),
                style: { fontSize: '14px' },
            },
            xAxis: {
                categories,
                title: { text: null },
                labels: { style: { fontSize: '12px' } },
            },
            yAxis: {
                title: {
                    text: i18n.t('Mean absolute SHAP value'),
                    style: { fontSize: '11px', color: '#6e7a8a' },
                },
                labels: { style: { fontSize: '11px' } },
                min: 0,
            },
            tooltip: {
                formatter: function (this: Highcharts.TooltipFormatterContextObject) {
                    const feature = sortedFeatures[this.point.index];
                    return `<b>${formatFeatureName(feature.featureName)}</b><br/>${i18n.t('Importance')}: ${Math.abs(feature.importance).toFixed(4)}`;
                },
            },
            plotOptions: {
                bar: {
                    dataLabels: { enabled: false },
                    color: CHART_COLORS.neutral,
                    borderRadius: 2,
                    groupPadding: 0.1,
                    pointPadding: 0.05,
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
    }, [features, title, height]);

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
