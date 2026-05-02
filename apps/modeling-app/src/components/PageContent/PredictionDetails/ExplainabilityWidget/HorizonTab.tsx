import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, CircularLoader, NoticeBox, Menu, MenuItem } from '@dhis2/ui';
import {
    FeatureImportanceChart,
    ShapBeeswarmChart,
    type HorizonSummaryResponse,
    type ShapBeeswarmResponse,
} from '@dhis2-chap/ui';
import styles from './ExplainabilityWidget.module.css';
import { getChartHeight } from './getChartHeight';

type OrgUnitOption = { id: string; label: string };

type Props = {
    orgUnitOptions: OrgUnitOption[];
    localOrgUnit: string;
    onOrgUnitChange: (id: string) => void;
    horizonData: HorizonSummaryResponse | null;
    isHorizonLoading: boolean;
    horizonError: string | null;
    isExplanationJobRunning: boolean;
    supports: (viz: string) => boolean;
    beeswarmData: ShapBeeswarmResponse | undefined;
    isBeeswarmLoading: boolean;
    beeswarmError?: string | null;
    orgUnitMap: Record<string, string>;
    onRunExplanations: () => void;
    onLoadBeeswarm: () => void;
};

export const HorizonTab = ({
    orgUnitOptions,
    localOrgUnit,
    onOrgUnitChange,
    horizonData,
    isHorizonLoading,
    horizonError,
    isExplanationJobRunning,
    supports,
    beeswarmData,
    isBeeswarmLoading,
    beeswarmError,
    orgUnitMap,
    onRunExplanations,
    onLoadBeeswarm,
}: Props) => {
    const [horizonView, setHorizonView] = useState<'importance' | 'beeswarm'>('importance');
    const showBeeswarm = supports('beeswarm') && horizonView === 'beeswarm';
    const orgLabel = orgUnitOptions.find(o => o.id === localOrgUnit)?.label ?? localOrgUnit;

    const importanceFeatureCount = horizonData?.averageImportance.length ?? 0;
    const beeswarmFeatureCount = beeswarmData ? beeswarmData.featureNames.length : importanceFeatureCount;
    const chartHeight = getChartHeight(importanceFeatureCount, beeswarmFeatureCount, supports('beeswarm'));

    return (
        <div className={styles.mainLayout}>
            <div className={styles.sidebar}>
                <Menu dense>
                    {orgUnitOptions.map(o => (
                        <MenuItem
                            active={localOrgUnit === o.id}
                            key={o.id}
                            label={o.label}
                            onClick={() => onOrgUnitChange(o.id)}
                        />
                    ))}
                </Menu>
            </div>
            <div className={styles.plotArea}>
                {(isHorizonLoading || (isExplanationJobRunning && !horizonData)) && !horizonData ? (
                    <div className={styles.loadingContainer}><CircularLoader small /></div>
                ) : horizonError && !horizonData ? (
                    <NoticeBox error title={i18n.t('Error')}>{horizonError}</NoticeBox>
                ) : horizonData ? (
                    <div className={styles.chartContainer}>
                        {isHorizonLoading && (
                            <div className={styles.loadingOverlay}><CircularLoader small /></div>
                        )}
                        <div className={styles.chartHeader}>
                            <h4 className={styles.horizonTitle}>
                                {i18n.t('Forecast Horizon Summary — {{orgUnit}}', { orgUnit: orgLabel })}
                            </h4>
                            <Button small secondary onClick={onRunExplanations} loading={isExplanationJobRunning} disabled={isExplanationJobRunning}>
                                {i18n.t('Recalculate')}
                            </Button>
                        </div>

                        {supports('beeswarm') && (
                            <ButtonStrip>
                                <Button
                                    small
                                    primary={horizonView === 'importance'}
                                    onClick={() => setHorizonView('importance')}
                                >
                                    {i18n.t('Importance')}
                                </Button>
                                <Button
                                    small
                                    primary={horizonView === 'beeswarm'}
                                    onClick={() => setHorizonView('beeswarm')}
                                >
                                    {i18n.t('SHAP Summary')}
                                </Button>
                            </ButtonStrip>
                        )}

                        {!showBeeswarm ? (
                            <>
                                <p className={styles.horizonDesc}>
                                    {i18n.t(
                                        'Average feature importance across all forecast steps in the horizon window. '
                                        + 'This shows which features are the dominant drivers for the upcoming period overall. '
                                        + 'Use the Local tab to inspect individual steps in detail.',
                                    )}
                                </p>

                                {horizonData.averageImportance.length > 0 && (
                                    <FeatureImportanceChart
                                        features={horizonData.averageImportance.map(f => ({
                                            featureName: f.featureName,
                                            importance: f.meanAbsImportance,
                                            direction: f.direction,
                                        }))}
                                        title={i18n.t('Average Horizon Importance — mean |SHAP| across {{n}} steps', {
                                            n: horizonData.steps.length,
                                        })}
                                        height={chartHeight}
                                    />
                                )}
                            </>
                        ) : isBeeswarmLoading ? (
                            <div className={styles.chartLoadingWrapper}>
                                <div className={styles.loadingOverlay}><CircularLoader small /></div>
                                <FeatureImportanceChart
                                    features={horizonData.averageImportance.map(f => ({
                                        featureName: f.featureName,
                                        importance: f.meanAbsImportance,
                                        direction: f.direction,
                                    }))}
                                    title={i18n.t('Average Horizon Importance — mean |SHAP| across {{n}} steps', {
                                        n: horizonData.steps.length,
                                    })}
                                    height={chartHeight}
                                />
                            </div>
                        ) : beeswarmData ? (
                            <ShapBeeswarmChart
                                points={beeswarmData.points.filter(p => p.orgUnit === localOrgUnit)}
                                featureNames={beeswarmData.featureNames}
                                orgUnitMap={orgUnitMap}
                                title={i18n.t('SHAP Summary — {{orgUnit}} across horizon steps', {
                                    orgUnit: orgLabel,
                                })}
                                height={chartHeight}
                            />
                        ) : (
                            <div className={styles.emptyState}>
                                <p>{beeswarmError ?? i18n.t('SHAP summary data not yet loaded.')}</p>
                                <Button small primary onClick={onLoadBeeswarm}>{i18n.t('Load')}</Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>{i18n.t('No horizon summary available.')}</p>
                        <Button primary onClick={onRunExplanations} loading={isExplanationJobRunning} disabled={!localOrgUnit || isExplanationJobRunning}>
                            {i18n.t('Compute Horizon Summary')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
