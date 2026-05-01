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
    if (isGlobalLoading || (isGlobalFetching && !globalExplanation?.available && !isGlobalTransitioning) || (isExplanationJobRunning && !globalExplanation?.available)) {
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

    const features: FeatureAttribution[] = globalExplanation.topFeatures.map((f) => ({
        feature_name: f.feature_name,
        importance: f.importance,
        direction: f.direction,
    }));

    return (
        <div className={styles.chartContainer} style={{ position: 'relative' }}>
            {isGlobalTransitioning && (
                <div className={styles.loadingOverlay}><CircularLoader small /></div>
            )}
            <div className={styles.chartHeader}>
                {supports('beeswarm') && (
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.toggleBtn} ${globalView === 'importance' ? styles.toggleBtnActive : ''}`}
                            onClick={() => onGlobalViewChange('importance')}
                        >
                            {i18n.t('Importance')}
                        </button>
                        <button
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
                    <div className={styles.loadingContainer}><CircularLoader small /></div>
                ) : beeswarmData ? (
                    <ShapBeeswarmChart
                        points={beeswarmData.points}
                        featureNames={beeswarmData.featureNames}
                        orgUnitMap={orgUnitMap}
                        title={i18n.t('SHAP Summary — how feature values affect predictions')}
                    />
                ) : (
                    <div className={styles.emptyState}>
                        <p>{beeswarmError ?? i18n.t('SHAP summary data not yet loaded.')}</p>
                        <Button small primary onClick={onLoadBeeswarm}>{i18n.t('Load')}</Button>
                    </div>
                )
            ) : (
                <FeatureImportanceChart features={features} title={i18n.t('Global Feature Importance')} />
            )}

            <SurrogateQualityPanel
                quality={globalExplanation.surrogateQuality || beeswarmData?.surrogateQuality}
                stabilityScore={globalExplanation.stabilityScore}
            />
        </div>
    );
};
