import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, CircularLoader, NoticeBox } from '@dhis2/ui';
import {
    FeatureImportanceChart,
    ShapBeeswarmChart,
    explainabilityAlignedTabChartHeight,
    type FeatureAttribution,
    type GlobalExplanationResponse,
    type ShapBeeswarmResponse,
} from '@dhis2-chap/ui';
import { SurrogateQualityPanel } from './SurrogateQualityPanel';
import styles from './ExplainabilityWidget.module.css';

type Props = {
    isGlobalLoading: boolean;
    isGlobalFetching: boolean;
    isGlobalTransitioning: boolean;
    isExplanationJobRunning: boolean;
    globalError: unknown;
    globalExplanation: GlobalExplanationResponse | undefined;
    supports: (viz: string) => boolean;
    isBeeswarmLoading: boolean;
    beeswarmData: ShapBeeswarmResponse | undefined;
    beeswarmError?: string | null;
    orgUnitMap: Record<string, string>;
    onRunExplanations: () => void;
    onComputeBeeswarm: () => void;
};

export const GlobalTab = ({
    isGlobalLoading,
    isGlobalFetching,
    isGlobalTransitioning,
    isExplanationJobRunning,
    globalError,
    globalExplanation,
    supports,
    isBeeswarmLoading,
    beeswarmData,
    beeswarmError,
    orgUnitMap,
    onRunExplanations,
    onComputeBeeswarm,
}: Props) => {
    const [globalView, setGlobalView] = useState<'importance' | 'beeswarm'>('importance');
    if (!globalExplanation && (isGlobalLoading || (isGlobalFetching && !isGlobalTransitioning) || isExplanationJobRunning)) {
        return <div className={styles.loadingContainer}><CircularLoader small /></div>;
    }
    if (globalError) {
        return <NoticeBox error title={i18n.t('Error')}>{i18n.t('Failed to load global explanation')}</NoticeBox>;
    }
    if (!globalExplanation?.topFeatures.length) {
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

    const beeswarmFeatureCount = beeswarmData ? beeswarmData.featureNames.length : features.length;
    const chartHeight = explainabilityAlignedTabChartHeight(
        features.length,
        beeswarmFeatureCount,
        supports('beeswarm'),
    );

    return (
        <div className={styles.chartContainer}>
            {isGlobalTransitioning && (
                <div className={styles.loadingOverlay}><CircularLoader small /></div>
            )}
            <div className={styles.chartHeader}>
                {supports('beeswarm') && (
                    <ButtonStrip>
                        <Button
                            small
                            primary={globalView === 'importance'}
                            onClick={() => setGlobalView('importance')}
                        >
                            {i18n.t('Importance')}
                        </Button>
                        <Button
                            small
                            primary={globalView === 'beeswarm'}
                            onClick={() => setGlobalView('beeswarm')}
                        >
                            {i18n.t('SHAP Summary')}
                        </Button>
                    </ButtonStrip>
                )}
                <Button small secondary onClick={onRunExplanations} loading={isExplanationJobRunning} disabled={isExplanationJobRunning}>
                    {i18n.t('Recalculate')}
                </Button>
            </div>

            {supports('beeswarm') && globalView === 'beeswarm' ? (
                isBeeswarmLoading ? (
                    <div className={styles.chartLoadingWrapper}>
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
                        <p>{beeswarmError ?? i18n.t('SHAP summary data not yet computed.')}</p>
                        <Button small primary onClick={onComputeBeeswarm}>{i18n.t('Compute')}</Button>
                    </div>
                )
            ) : (
                <FeatureImportanceChart features={features} title={i18n.t('Global Feature Importance')} height={chartHeight} />
            )}

            <SurrogateQualityPanel
                quality={globalExplanation.surrogateQuality ?? beeswarmData?.surrogateQuality}
                stabilityScore={globalExplanation.stabilityScore ?? undefined}
            />
        </div>
    );
};
