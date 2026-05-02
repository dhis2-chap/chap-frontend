import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Tag, formatFeatureName, CHART_COLORS } from '@dhis2-chap/ui';
import styles from './ExplainabilityWidget.module.css';
import { normalizeFidelityTier, type SurrogateQuality } from './xaiTypes';

type Props = {
    quality?: SurrogateQuality;
    stabilityScore?: number;
};

export const SurrogateQualityPanel = ({ quality, stabilityScore }: Props) => {
    const [showMetrics, setShowMetrics] = useState(false);

    if (!quality) return null;
    const r2 = quality.rSquared;
    if (r2 == null) return null;

    const mae = quality.mae;
    const mape = quality.mape;
    const n = quality.nSamples;
    const unique = quality.nUniqueRows;
    const constantFeatures: string[] = quality.constantFeatures ?? [];
    const permRemovedFeatures: string[] = quality.permutationRemovedFeatures ?? [];
    const residualMean: number | null = quality.residualMean ?? null;
    const residualStd: number | null = quality.residualStd ?? null;
    const fidelityTier = normalizeFidelityTier(quality.fidelityTier);
    if (!fidelityTier) return null;
    const targetTransformMethod: string | null = quality.targetTransformMethod ?? null;
    const modelDisplayName: string = quality.selectedModelDisplayName ?? 'surrogate model';

    const r2Pct = (r2 * 100).toFixed(1);
    const r2Color = fidelityTier === 'good' ? CHART_COLORS.qualityGood : fidelityTier === 'moderate' ? CHART_COLORS.qualityModerate : CHART_COLORS.qualityPoor;
    const r2Label = fidelityTier === 'good' ? i18n.t('Good') : fidelityTier === 'moderate' ? i18n.t('Moderate') : i18n.t('Poor');
    const duplicateRatio = unique != null && n != null && n > 0 ? ((1 - unique / n) * 100).toFixed(0) : null;

    const summaryLine = fidelityTier === 'good'
        ? i18n.t('explanations closely match the original model')
        : fidelityTier === 'moderate'
            ? i18n.t('directionally useful, magnitudes are approximate')
            : i18n.t('explanations may not reflect the original model');

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
                <span className={styles.qualityDot} style={{ background: r2Color }} />
                <span className={styles.qualityBadgeText}>
                    <strong style={{ color: r2Color }}>{r2Label}</strong>
                    {i18n.t(' — {{summary}}', { summary: summaryLine })}
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
                            style={{ width: `${Math.min(100, r2 * 100)}%`, background: r2Color }}
                        />
                    </div>

                    <div className={styles.qualityMetrics}>
                        <div className={styles.qualityMetric}>
                            <span className={styles.qualityMetricLabel}>{i18n.t('CV R²')}</span>
                            <span className={styles.qualityMetricValue} style={{ color: r2Color }}>
                                {r2Pct}
                                %
                            </span>
                            <span className={styles.qualityMetricRating} style={{ color: r2Color }}>
                                {r2Label}
                            </span>
                        </div>
                        {mae != null && (
                            <div className={styles.qualityMetric}>
                                <span className={styles.qualityMetricLabel}>{i18n.t('MAE')}</span>
                                <span className={styles.qualityMetricValue}>
                                    {mae < 1 ? mae.toFixed(3) : mae.toFixed(1)}
                                </span>
                                {mape != null && (
                                    <span className={styles.qualityMetricRating} style={{ color: 'var(--colors-grey600)' }}>
                                        {(mape * 100).toFixed(1)}
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
                                    {residualMean < 1 && residualMean > -1 ? residualMean.toFixed(3) : residualMean.toFixed(1)}
                                </span>
                                <span className={styles.qualityMetricRating} style={{ color: 'var(--colors-grey600)' }}>
                                    {i18n.t('±{{std}}', { std: residualStd < 1 ? residualStd.toFixed(3) : residualStd.toFixed(1) })}
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
                                    {(stabilityScore * 100).toFixed(1)}
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
