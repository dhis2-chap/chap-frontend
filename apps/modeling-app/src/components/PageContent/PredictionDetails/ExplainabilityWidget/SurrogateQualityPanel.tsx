import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Tag, formatFeatureName, CHART_COLORS, type SurrogateQualityRead } from '@dhis2-chap/ui';
import styles from './SurrogateQualityPanel.module.css';

type FidelityTier = NonNullable<SurrogateQualityRead['fidelityTier']>;

type Props = {
    quality?: SurrogateQualityRead | null;
    stabilityScore?: number;
};

const formatMetric = (v: number) => (Math.abs(v) < 1 ? v.toFixed(3) : v.toFixed(1));
const formatPct = (v: number) => (v * 100).toFixed(1);

export const SurrogateQualityPanel = ({ quality, stabilityScore }: Props) => {
    const [showMetrics, setShowMetrics] = useState(false);

    // Built inside the component so i18n strings reflect the current locale
    // rather than the locale at module load time.
    const tierMeta = useMemo<Record<FidelityTier, { color: string; label: string; summary: string }>>(() => ({
        good: {
            color: CHART_COLORS.qualityGood,
            label: i18n.t('Good'),
            summary: i18n.t('explanations closely match the original model'),
        },
        moderate: {
            color: CHART_COLORS.qualityModerate,
            label: i18n.t('Moderate'),
            summary: i18n.t('directionally useful, magnitudes are approximate'),
        },
        poor: {
            color: CHART_COLORS.qualityPoor,
            label: i18n.t('Poor'),
            summary: i18n.t('explanations may not reflect the original model'),
        },
    }), []);

    if (!quality) return null;
    const r2 = quality.rSquared;
    if (r2 == null) return null;
    const fidelityTier = quality.fidelityTier;
    if (fidelityTier == null) return null;

    const { mae, mape, nSamples: n, nUniqueRows: unique, residualMean, residualStd, targetTransformMethod } = quality;
    const constantFeatures = quality.constantFeatures ?? [];
    const permRemovedFeatures = quality.permutationRemovedFeatures ?? [];
    const modelDisplayName = quality.selectedModelDisplayName ?? i18n.t('surrogate model');

    const { color, label, summary } = tierMeta[fidelityTier];
    const duplicateRatio = unique != null && n != null && n > 0 ? ((1 - unique / n) * 100).toFixed(0) : null;

    return (
        <div className={styles.qualityPanel}>
            <div className={styles.qualityHeaderRow}>
                <div className={styles.qualityHeaderLeft}>
                    <span className={styles.qualityHeader}>{i18n.t('Surrogate Model Quality')}</span>
                    <Tag variant="info">{modelDisplayName}</Tag>
                </div>
                <button
                    type="button"
                    className={styles.metricsToggle}
                    onClick={() => setShowMetrics(v => !v)}
                >
                    {showMetrics ? i18n.t('Hide metrics') : i18n.t('Show metrics')}
                </button>
            </div>
            <div className={styles.qualityBadge}>
                <span className={styles.qualityDot} style={{ background: color }} />
                <span className={styles.qualityBadgeText}>
                    <strong style={{ color }}>{label}</strong>
                    {' — '}
                    {summary}
                </span>
            </div>

            {constantFeatures.length > 0 && (
                <p className={styles.qualityInlineNote}>
                    {i18n.t('{{n}} feature(s) had no variation and were excluded from explanations{{colon}} {{list}}', {
                        n: constantFeatures.length,
                        colon: ':',
                        list: constantFeatures.map(formatFeatureName).join(', '),
                    })}
                </p>
            )}
            {permRemovedFeatures.length > 0 && (
                <p className={styles.qualityInlineNote}>
                    {i18n.t('{{n}} low-signal feature(s) removed by permutation selection{{colon}} {{list}}', {
                        n: permRemovedFeatures.length,
                        colon: ':',
                        list: permRemovedFeatures.map(formatFeatureName).join(', '),
                    })}
                </p>
            )}

            {showMetrics && (
                <div className={styles.metricsArea}>
                    <p className={styles.metricsDescription}>
                        {i18n.t(
                            'A {{modelName}} approximates the original prediction model. '
                            + 'These metrics show how faithfully it reproduces the original model\'s predictions.',
                            { modelName: modelDisplayName },
                        )}
                    </p>

                    <div className={styles.qualityBar}>
                        <div
                            className={styles.qualityBarFill}
                            style={{ width: `${Math.min(100, r2 * 100)}%`, background: color }}
                        />
                    </div>

                    <div className={styles.qualityMetrics}>
                        <div className={styles.qualityMetric}>
                            <span className={styles.qualityMetricLabel}>{i18n.t('CV R²')}</span>
                            <span className={styles.qualityMetricValue} style={{ color }}>
                                {formatPct(r2)}
                                %
                            </span>
                            <span className={styles.qualityMetricRating} style={{ color }}>
                                {label}
                            </span>
                        </div>
                        {mae != null && (
                            <div className={styles.qualityMetric}>
                                <span className={styles.qualityMetricLabel}>{i18n.t('MAE')}</span>
                                <span className={styles.qualityMetricValue}>
                                    {formatMetric(mae)}
                                </span>
                                {mape != null && (
                                    <span className={styles.qualityMetricRating} style={{ color: 'var(--colors-grey600)' }}>
                                        {formatPct(mape)}
                                        {i18n.t('% MAPE')}
                                    </span>
                                )}
                            </div>
                        )}
                        {residualMean != null && residualStd != null && (
                            <div className={styles.qualityMetric}>
                                <span className={styles.qualityMetricLabel}>{i18n.t('Residual bias')}</span>
                                <span
                                    className={styles.qualityMetricValue}
                                    style={{ color: Math.abs(residualMean) > residualStd * 0.5 ? CHART_COLORS.qualityModerate : 'inherit' }}
                                >
                                    {residualMean >= 0 ? '+' : ''}
                                    {formatMetric(residualMean)}
                                </span>
                                <span className={styles.qualityMetricRating} style={{ color: 'var(--colors-grey600)' }}>
                                    {i18n.t('±{{std}}', { std: formatMetric(residualStd) })}
                                </span>
                            </div>
                        )}
                        <div className={styles.qualityMetric}>
                            <span className={styles.qualityMetricLabel}>{i18n.t('Samples')}</span>
                            <span className={styles.qualityMetricValue}>{n}</span>
                        </div>
                        {unique != null && (
                            <div className={styles.qualityMetric}>
                                <span className={styles.qualityMetricLabel}>{i18n.t('Unique rows')}</span>
                                <span className={styles.qualityMetricValue}>{unique}</span>
                                {duplicateRatio != null && Number(duplicateRatio) > 0 && (
                                    <span className={styles.qualityMetricRating} style={{ color: 'var(--colors-grey600)' }}>
                                        {i18n.t('{{pct}}% duplicated', { pct: duplicateRatio })}
                                    </span>
                                )}
                            </div>
                        )}
                        {stabilityScore != null && (
                            <div className={styles.qualityMetric}>
                                <span className={styles.qualityMetricLabel}>{i18n.t('Stability')}</span>
                                <span className={styles.qualityMetricValue}>
                                    {formatPct(stabilityScore)}
                                    %
                                </span>
                                <span className={styles.qualityMetricRating} style={{ color: 'var(--colors-grey600)' }}>
                                    {i18n.t('ranking consistency')}
                                </span>
                            </div>
                        )}
                    </div>

                    {targetTransformMethod && (
                        <p className={styles.qualityInlineNote}>
                            {i18n.t('Predictions were rescaled from a transformed target space ({{method}}) — attributions are first-order approximations.', {
                                method: targetTransformMethod,
                            })}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
