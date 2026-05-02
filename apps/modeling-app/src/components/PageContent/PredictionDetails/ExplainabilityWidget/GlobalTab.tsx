import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox } from '@dhis2/ui';
import {
    FeatureImportanceChart,
    ShapBeeswarmChart,
    type FeatureAttribution,
    type GlobalExplanationResponse,
    type ShapBeeswarmResponse,
} from '@dhis2-chap/ui';
import { SurrogateQualityPanel } from './SurrogateQualityPanel';
import styles from './ExplainabilityWidget.module.css';
import type { SurrogateQuality } from './xaiTypes';

type Props = {
    isGlobalLoading: boolean;
    isGlobalFetching: boolean;
    isGlobalTransitioning: boolean;
    isExplanationJobRunning: boolean;
    globalError: unknown;
    globalExplanation: GlobalExplanationResponse | undefined;
    supports: (viz: string) => boolean;
    globalView: 'importance' | 'beeswarm';
    onGlobalViewChange: (v: 'importance' | 'beeswarm') => void;
    isBeeswarmLoading: boolean;
    beeswarmData: ShapBeeswarmResponse | null;
    beeswarmError?: string | null;
    orgUnitMap: Record<string, string>;
    onRunExplanations: () => void;
    onLoadBeeswarm: () => void;
};

export const GlobalTab = ({
    isGlobalLoading,
    isGlobalFetching,
    isGlobalTransitioning,
    isExplanationJobRunning,
    globalError,
    globalExplanation,
    supports,
    globalView,
    onGlobalViewChange,
    isBeeswarmLoading,
    beeswarmData,
    beeswarmError,
    orgUnitMap,
    onRunExplanations,
    onLoadBeeswarm,
}: Props) => {
    if (!globalExplanation?.available && (isGlobalLoading || (isGlobalFetching && !isGlobalTransitioning) || isExplanationJobRunning)) {
        return <div className={styles.loadingContainer}><CircularLoader small /></div>;
    }
    if (globalError) {
        return <NoticeBox error title={i18n.t('Error')}>{i18n.t('Failed to load global explanation')}</NoticeBox>;
    }
    if (!globalExplanation?.available || !globalExplanation?.topFeatures?.length) {
        return (
            <div className={styles.emptyState}>
                <p>{i18n.t('No global explanation computed yet.')}</p>
                <Button primary onClick={onRunExplanations} loading={isExplanationJobRunning} disabled={isExplanationJobRunning}>
                    {i18n.t('Compute Explanation')}
                </Button>
            </div>
        );
    }

    const features: FeatureAttribution[] = globalExplanation.topFeatures.map(f => ({
        featureName: f.featureName,
        importance: f.importance,
        direction: f.direction,
    }));

    const featureCount = beeswarmData ? beeswarmData.featureNames.length : features.length;
    const chartHeight = Math.max(
        Math.max(200, features.length * 35 + 80),
        supports('beeswarm') ? Math.max(300, featureCount * 50 + 120) : 0,
    );

    return (
        <div className={styles.chartContainer} style={{ position: 'relative' }}>
            {isGlobalTransitioning && (
                <div className={styles.loadingOverlay}><CircularLoader small /></div>
            )}
            <div className={styles.chartHeader}>
                {supports('beeswarm') && (
                    <div className={styles.viewToggle}>
                        <button
                            type="button"
                            className={`${styles.toggleBtn} ${globalView === 'importance' ? styles.toggleBtnActive : ''}`}
                            onClick={() => onGlobalViewChange('importance')}
                        >
                            {i18n.t('Importance')}
                        </button>
                        <button
                            type="button"
                            className={`${styles.toggleBtn} ${globalView === 'beeswarm' ? styles.toggleBtnActive : ''}`}
                            onClick={() => onGlobalViewChange('beeswarm')}
                        >
                            {i18n.t('SHAP Summary')}
                        </button>
                    </div>
                )}
                <Button small secondary onClick={onRunExplanations} loading={isExplanationJobRunning} disabled={isExplanationJobRunning}>
                    {i18n.t('Recalculate')}
                </Button>
            </div>

            {supports('beeswarm') && globalView === 'beeswarm' ? (
                isBeeswarmLoading ? (
                    <div style={{ position: 'relative' }}>
                        <div className={styles.loadingOverlay}><CircularLoader small /></div>
                        <FeatureImportanceChart features={features} title={i18n.t('Global Feature Importance')} height={chartHeight} />
                    </div>
                ) : beeswarmData ? (
                    <ShapBeeswarmChart
                        points={beeswarmData.points}
                        featureNames={beeswarmData.featureNames}
                        orgUnitMap={orgUnitMap}
                        title={i18n.t('SHAP Summary — how feature values affect predictions')}
                        height={chartHeight}
                    />
                ) : (
                    <div className={styles.emptyState}>
                        <p>{beeswarmError ?? i18n.t('SHAP summary data not yet loaded.')}</p>
                        <Button small primary onClick={onLoadBeeswarm}>{i18n.t('Load')}</Button>
                    </div>
                )
            ) : (
                <FeatureImportanceChart features={features} title={i18n.t('Global Feature Importance')} height={chartHeight} />
            )}

            <SurrogateQualityPanel
                quality={(globalExplanation.surrogateQuality || beeswarmData?.surrogateQuality) as SurrogateQuality | undefined}
                stabilityScore={globalExplanation.stabilityScore ?? undefined}
            />
        </div>
    );
};
