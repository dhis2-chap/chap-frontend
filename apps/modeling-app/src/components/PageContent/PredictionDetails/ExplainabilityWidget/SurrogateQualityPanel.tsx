import React, { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { NoticeBox } from '@dhis2/ui';
import styles from './ExplainabilityWidget.module.css';

const formatFeatureName = (name: string): string =>
    name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

type Props = {
    quality?: any;
    stabilityScore?: number;
};

export const SurrogateQualityPanel = ({ quality, stabilityScore }: Props) => {
    const [showInfo, setShowInfo] = useState(false);

    if (!quality) return null;
    const r2 = quality.rSquared ?? quality.r_squared;
    const mae = quality.mae;
    const mape = quality.mape;
    const n = quality.nSamples ?? quality.n_samples;
    const unique = quality.nUniqueRows ?? quality.n_unique_rows;
    const constantFeatures: string[] = quality.constantFeatures ?? quality.constant_features ?? [];
    const permRemovedFeatures: string[] = quality.permutationRemovedFeatures ?? quality.permutation_removed_features ?? [];
    const residualMean: number | null = quality.residualMean ?? quality.residual_mean ?? null;
    const residualStd: number | null = quality.residualStd ?? quality.residual_std ?? null;
    const fidelityTier: string = quality.fidelityTier ?? quality.fidelity_tier ?? (r2 == null ? 'poor' : r2 >= 0.8 ? 'good' : r2 >= 0.5 ? 'moderate' : 'poor');
    const fidelityWarning: string | null = quality.fidelityWarning ?? quality.fidelity_warning ?? null;
    const targetTransformMethod: string | null = quality.targetTransformMethod ?? quality.target_transform_method ?? null;
    const modelDisplayName: string = quality.selectedModelDisplayName ?? quality.selected_model_display_name ?? 'surrogate model';
    if (r2 == null) return null;

    const r2Pct = (r2 * 100).toFixed(1);
    const r2Color = fidelityTier === 'good' ? '#4caf50' : fidelityTier === 'moderate' ? '#ff9800' : '#f44336';
    const r2Label = fidelityTier === 'good' ? i18n.t('Good') : fidelityTier === 'moderate' ? i18n.t('Moderate') : i18n.t('Poor');
    const duplicateRatio = unique != null && n > 0 ? ((1 - unique / n) * 100).toFixed(0) : null;

    return (
        <div className={styles.qualityPanel}>
            <div className={styles.qualityHeaderRow}>
                <div className={styles.qualityHeader}>
                    {i18n.t('Surrogate Model Quality')}
                </div>
                <button
                    className={styles.qualityInfoBtn}
                    onClick={() => setShowInfo((v) => !v)}
                    title={i18n.t('What do these metrics mean?')}
                >
                    {showInfo ? i18n.t('Hide info') : i18n.t('What is this?')}
                </button>
            </div>

            {showInfo && (
                <div className={styles.qualityInfoBox}>
                    <p>
                        {i18n.t(
                            'Explanations are computed using a surrogate model ({{modelName}}) ' +
                            'that approximates the original prediction model. These metrics show how well ' +
                            'the surrogate reproduces the original model\'s predictions.',
                            { modelName: modelDisplayName }
                        )}
                    </p>
                    <dl className={styles.qualityInfoList}>
                        <dt>{i18n.t('CV R²')}</dt>
                        <dd>{i18n.t(
                            'Leave-one-out cross-validated R². Measures how much of the original model\'s ' +
                            'variance the surrogate captures. 100% = perfect replica, 0% = no better than predicting the mean.'
                        )}</dd>
                        <dt>{i18n.t('MAE')}</dt>
                        <dd>{i18n.t(
                            'Mean Absolute Error between the surrogate and original model predictions. ' +
                            'Lower is better — shows the average difference in prediction units.'
                        )}</dd>
                        <dt>{i18n.t('Residual bias')}</dt>
                        <dd>{i18n.t(
                            'Mean and standard deviation of (actual − predicted) LOO residuals. ' +
                            'A large mean indicates systematic over- or under-prediction by the surrogate.'
                        )}</dd>
                        <dt>{i18n.t('Samples')}</dt>
                        <dd>{i18n.t(
                            'Number of data points used to train the surrogate. More samples generally ' +
                            'produce more reliable explanations.'
                        )}</dd>
                        <dt>{i18n.t('Unique rows')}</dt>
                        <dd>{i18n.t(
                            'Number of distinct data points. If much lower than total samples, ' +
                            'many rows are duplicated, which can inflate apparent quality.'
                        )}</dd>
                        <dt>{i18n.t('Stability Score')}</dt>
                        <dd>{i18n.t(
                            'How stable the global feature ranking is across bootstrap resamples. ' +
                            'Higher means the same top features appear consistently.'
                        )}</dd>
                    </dl>
                </div>
            )}

            <div className={styles.qualityMetrics}>
                <div className={styles.qualityMetric}>
                    <span className={styles.qualityMetricLabel}>{i18n.t('CV R²')}</span>
                    <span className={styles.qualityMetricValue} style={{ color: r2Color }}>
                        {r2Pct}%
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
                                {(mape * 100).toFixed(1)}{i18n.t('% MAPE')}
                            </span>
                        )}
                    </div>
                )}
                {residualMean != null && residualStd != null && (
                    <div className={styles.qualityMetric}>
                        <span className={styles.qualityMetricLabel}>{i18n.t('Residual bias')}</span>
                        <span className={styles.qualityMetricValue} style={{ color: Math.abs(residualMean) > residualStd * 0.5 ? '#ff9800' : 'inherit' }}>
                            {residualMean >= 0 ? '+' : ''}{residualMean < 1 && residualMean > -1 ? residualMean.toFixed(3) : residualMean.toFixed(1)}
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
                        <span className={styles.qualityMetricLabel}>{i18n.t('Stability Score')}</span>
                        <span className={styles.qualityMetricValue}>{(stabilityScore * 100).toFixed(1)}%</span>
                        <span className={styles.qualityMetricRating} style={{ color: 'var(--colors-grey600)' }}>
                            {i18n.t('ranking consistency')}
                        </span>
                    </div>
                )}
            </div>
            <div className={styles.qualityBar}>
                <div
                    className={styles.qualityBarFill}
                    style={{ width: `${Math.min(100, r2 * 100)}%`, background: r2Color }}
                />
            </div>
            <p className={styles.qualityNote}>
                {fidelityTier === 'poor'
                    ? i18n.t('The surrogate approximation is poor — explanations may not accurately reflect the original model. This often happens with very few data points.')
                    : fidelityTier === 'moderate'
                    ? i18n.t('The surrogate captures moderate signal. Explanations are directionally useful but approximate. Feature ranking is likely correct even if magnitudes are off.')
                    : i18n.t('The surrogate closely approximates the original model. Explanations are reliable.')}
            </p>
            {fidelityWarning && fidelityTier !== 'good' && (
                <NoticeBox warning>
                    {fidelityWarning}
                </NoticeBox>
            )}
            {targetTransformMethod && (
                <NoticeBox>
                    {i18n.t('Target transform applied{{colon}} {{method}}. SHAP values are rescaled back to the original prediction units; attributions are first-order approximations in the transformed space.', { colon: ':', method: targetTransformMethod })}
                </NoticeBox>
            )}
            {constantFeatures.length > 0 && (
                <NoticeBox warning title={i18n.t('Constant features detected')}>
                    {i18n.t('The following features have no variation in the training data and cannot contribute to explanations{{colon}} ', { colon: ':' })}
                    {constantFeatures.map(formatFeatureName).join(', ')}
                </NoticeBox>
            )}
            {permRemovedFeatures.length > 0 && (
                <NoticeBox title={i18n.t('Features removed by permutation selection')}>
                    {i18n.t('The following features were removed as noise by permutation importance selection{{colon}} ', { colon: ':' })}
                    {permRemovedFeatures.map(formatFeatureName).join(', ')}
                </NoticeBox>
            )}
        </div>
    );
};
