import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { ShapBeeswarmPoint } from '../../../httpfunctions/services/XaiService';
import { formatFeatureName } from '../utils';
import styles from './ShapBeeswarmChart.module.css';

interface ShapBeeswarmChartProps {
    points: ShapBeeswarmPoint[];
    featureNames: string[];
    title?: string;
    highlightOrgUnit?: string;
    highlightPeriod?: string;
    orgUnitMap?: Record<string, string>;
}

const interpolateColor = (t: number): string => {
    const r = Math.round(66 + t * (239 - 66));
    const g = Math.round(165 + t * (83 - 165));
    const b = Math.round(245 + t * (80 - 245));
    return `rgb(${r},${g},${b})`;
};

const jitterForKey = (key: string): number => {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
        h = Math.imul(31, h) + key.charCodeAt(i) | 0;
    }
    return ((h >>> 0) / 0xffffffff - 0.5) * 0.3;
};

export const ShapBeeswarmChart = ({
    points,
    featureNames,
    title,
    highlightOrgUnit,
    highlightPeriod,
    orgUnitMap,
}: ShapBeeswarmChartProps) => {
    const hasHighlight = !!(highlightOrgUnit && highlightPeriod);

    const jitterCache = useMemo(
        () => new Map(points.map((p) => {
            const key = `${p.orgUnit}|${p.period}|${p.featureName}`;
            return [key, jitterForKey(key)];
        })),
        [points],
    );

    const options: Highcharts.Options = useMemo(() => {
        const featureRanges: Record<string, { min: number; max: number }> = {};
        for (const p of points) {
            const name = p.featureName;
            const val = p.featureValue;
            if (!featureRanges[name]) {
                featureRanges[name] = { min: val, max: val };
            } else {
                featureRanges[name].min = Math.min(featureRanges[name].min, val);
                featureRanges[name].max = Math.max(featureRanges[name].max, val);
            }
        }

        const meanAbsShap: Record<string, number> = {};
        const counts: Record<string, number> = {};
        for (const p of points) {
            const name = p.featureName;
            const sv = p.shapValue;
            meanAbsShap[name] = (meanAbsShap[name] || 0) + Math.abs(sv);
            counts[name] = (counts[name] || 0) + 1;
        }
        const sortedFeatures = [...featureNames]
            .filter(f => counts[f])
            .sort((a, b) => (meanAbsShap[a] / counts[a]) - (meanAbsShap[b] / counts[b]));

        const featureIndexMap: Record<string, number> = {};
        sortedFeatures.forEach((f, i) => {
            featureIndexMap[f] = i;
        });

        const bgData: Highcharts.PointOptionsObject[] = [];
        const hlData: Highcharts.PointOptionsObject[] = [];

        points.forEach((p) => {
            const name = p.featureName;
            const sv = p.shapValue;
            const fv = p.featureValue;
            const ou = p.orgUnit;
            const per = p.period;
            const range = featureRanges[name];
            const spread = range.max - range.min;
            const t = spread > 0 ? (fv - range.min) / spread : 0.5;

            const yIdx = featureIndexMap[name] ?? 0;
            const jitter = jitterCache.get(`${ou}|${per}|${name}`) ?? 0;

            const isHighlighted = hasHighlight && ou === highlightOrgUnit && per === highlightPeriod;

            const pt = {
                x: sv,
                y: yIdx + jitter,
                color: isHighlighted ? '#000' : interpolateColor(t),
                custom: {
                    featureName: name,
                    featureValue: fv,
                    shapValue: sv,
                    orgUnit: ou,
                    period: per,
                },
            };

            if (isHighlighted) {
                hlData.push(pt);
            } else {
                bgData.push(pt);
            }
        });

        const chartHeight = Math.max(300, sortedFeatures.length * 50 + 120);

        return {
            chart: {
                type: 'scatter',
                height: chartHeight,
                style: { fontFamily: 'inherit' },
                marginLeft: 160,
            },
            title: {
                text: title || i18n.t('SHAP Summary — Feature Impact'),
                style: { fontSize: '13px', fontWeight: '500' },
                align: 'left' as Highcharts.AlignValue,
            },
            xAxis: {
                title: {
                    text: i18n.t('SHAP value (impact on model output)'),
                    style: { fontSize: '11px' },
                },
                plotLines: [{
                    value: 0,
                    color: '#bbb',
                    width: 1,
                    dashStyle: 'Dash' as Highcharts.DashStyleValue,
                    zIndex: 2,
                }],
                gridLineWidth: 0,
            },
            yAxis: {
                categories: sortedFeatures.map(formatFeatureName),
                title: { text: null },
                labels: {
                    style: { fontSize: '11px' },
                },
                gridLineWidth: 0,
                min: -0.5,
                max: sortedFeatures.length - 0.5,
            },
            tooltip: {
                formatter: function (this: Highcharts.TooltipFormatterContextObject) {
                    const c = (this.point as any).custom;
                    if (!c) return '';
                    const sign = c.shapValue >= 0 ? '+' : '';
                    const orgUnitLabel = orgUnitMap?.[c.orgUnit] ?? c.orgUnit;
                    return (
                        `<b>${formatFeatureName(c.featureName)}</b><br/>`
                        + `${i18n.t('Feature value')}: ${c.featureValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}<br/>`
                        + `${i18n.t('SHAP{{colon}}', { colon: ':' })} <b>${sign}${c.shapValue.toFixed(3)}</b><br/>`
                        + `${orgUnitLabel} — ${c.period}`
                    );
                },
            },
            plotOptions: {
                scatter: {
                    marker: {
                        radius: 3.5,
                        symbol: 'circle',
                        lineWidth: 0,
                        states: {
                            hover: { radiusPlus: 2 },
                        },
                    },
                    jitter: { y: 0 },
                },
            },
            legend: { enabled: hasHighlight },
            credits: { enabled: false },
            series: [
                {
                    type: 'scatter' as const,
                    name: i18n.t('All forecasts'),
                    data: bgData,
                    turboThreshold: 5000,
                    showInLegend: hasHighlight,
                    marker: { radius: 3.5 },
                    opacity: hasHighlight ? 0.4 : 1,
                },
                ...(hasHighlight && hlData.length > 0 ? [{
                    type: 'scatter' as const,
                    name: i18n.t('Selected instance'),
                    data: hlData,
                    turboThreshold: 5000,
                    marker: {
                        radius: 7,
                        symbol: 'diamond' as const,
                        lineWidth: 2,
                        lineColor: '#000',
                    },
                    zIndex: 5,
                }] : []),
            ],
        };
    }, [points, featureNames, title, hasHighlight, highlightOrgUnit, highlightPeriod, orgUnitMap, jitterCache]);

    if (!points || points.length === 0) {
        return (
            <div className={styles.empty}>
                {i18n.t('No SHAP summary data available')}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <HighchartsReact highcharts={Highcharts} options={options} />
            <div className={styles.colorLegend}>
                <span className={styles.colorLegendLabel}>{i18n.t('Low')}</span>
                <div className={styles.colorGradient} />
                <span className={styles.colorLegendLabel}>{i18n.t('High')}</span>
                <span className={styles.colorLegendCaption}>{i18n.t('Feature value')}</span>
            </div>
            <p className={styles.annotation}>
                {i18n.t(
                    'Each dot is one forecast. Horizontal position = SHAP impact. '
                    + 'Color = feature value (blue = low, red = high). '
                    + 'Features that push predictions right (positive SHAP) increase the forecast.',
                )}
            </p>
        </div>
    );
};
