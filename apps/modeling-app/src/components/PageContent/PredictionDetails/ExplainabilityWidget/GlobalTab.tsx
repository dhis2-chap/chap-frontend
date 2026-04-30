import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox, Tag } from '@dhis2/ui';
import {
    FeatureImportanceChart,
    ShapBeeswarmChart,
    type FeatureAttribution,
    type ShapBeeswarmResponse,
} from '@dhis2-chap/ui';
import { SurrogateQualityPanel } from './SurrogateQualityPanel';
import styles from './ExplainabilityWidget.module.css';

type Props = {
    isGlobalLoading: boolean;
    isGlobalFetching: boolean;
    isExplanationJobRunning: boolean;
    globalError: unknown;
    globalExplanation: any;
    supports: (viz: string) => boolean;
    globalView: 'importance' | 'beeswarm';
    onGlobalViewChange: (v: 'importance' | 'beeswarm') => void;
    selectedXaiMethodObj: any;
    selectedXaiMethod: string;
    isBeeswarmLoading: boolean;
    beeswarmData: ShapBeeswarmResponse | null;
    orgUnitMap: Record<string, string>;
    onRunExplanations: () => void;
    onLoadBeeswarm: () => void;
};

export const GlobalTab = ({
    isGlobalLoading,
    isGlobalFetching,
    isExplanationJobRunning,
    globalError,
    globalExplanation,
    supports,
    globalView,
    onGlobalViewChange,
    selectedXaiMethodObj,
    selectedXaiMethod,
    isBeeswarmLoading,
    beeswarmData,
    orgUnitMap,
    onRunExplanations,
    onLoadBeeswarm,
}: Props) => {
    if (isGlobalLoading || (isGlobalFetching && !globalExplanation?.available) || (isExplanationJobRunning && !globalExplanation?.available)) {
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

    const features: FeatureAttribution[] = globalExplanation.topFeatures.map((f: any) => ({
        feature_name: f.feature_name || f.featureName,
        importance: f.importance,
        direction: f.direction,
    }));

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                {supports('beeswarm') ? (
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
                ) : (
                    <Tag>{selectedXaiMethodObj?.displayName ?? selectedXaiMethod}</Tag>
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
                        featureNames={beeswarmData.featureNames || (beeswarmData as any).feature_names || []}
                        orgUnitMap={orgUnitMap}
                        title={i18n.t('SHAP Summary — how feature values affect predictions')}
                    />
                ) : (
                    <div className={styles.emptyState}>
                        <p>{i18n.t('Loading SHAP summary data...')}</p>
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
            <p className={styles.disclaimer}>
                {i18n.t('Feature importance shows which inputs have the most influence on predictions. This does not imply causation.')}
            </p>
        </div>
    );
};
