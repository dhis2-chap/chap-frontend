import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, CircularLoader, NoticeBox, Menu, MenuItem } from '@dhis2/ui';
import {
    FeatureImportanceChart,
    ShapBeeswarmChart,
    explainabilityAlignedTabChartHeight,
    type HorizonSummaryResponse,
    type ShapBeeswarmResponse,
} from '@dhis2-chap/ui';
import widgetStyles from '../ExplainabilityWidget.module.css';
import styles from './HorizonTab.module.css';

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
    onComputeBeeswarm: () => void;
    onComputeHorizon: () => void;
    isComputingHorizon: boolean;
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
    onComputeBeeswarm,
    onComputeHorizon,
    isComputingHorizon,
}: Props) => {
    const [horizonView, setHorizonView] = useState<'importance' | 'beeswarm'>('importance');
    const showBeeswarm = supports('beeswarm') && horizonView === 'beeswarm';
    const orgLabel = orgUnitOptions.find(o => o.id === localOrgUnit)?.label ?? localOrgUnit;

    const importanceFeatureCount = horizonData?.averageImportance.length ?? 0;
    const beeswarmFeatureCount = beeswarmData ? beeswarmData.featureNames.length : importanceFeatureCount;
    const chartHeight = explainabilityAlignedTabChartHeight(
        importanceFeatureCount,
        beeswarmFeatureCount,
        supports('beeswarm'),
    );

    return (
        <div className={widgetStyles.mainLayout}>
            <div className={widgetStyles.sidebar}>
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
            <div className={widgetStyles.plotArea}>
                {(isHorizonLoading || isExplanationJobRunning) && !horizonData ? (
                    <div className={widgetStyles.loadingContainer}><CircularLoader small /></div>
                ) : horizonError && !horizonData ? (
                    <NoticeBox error title={i18n.t('Error')}>{horizonError}</NoticeBox>
                ) : !horizonData ? (
                    <div className={widgetStyles.emptyState}>
                        <p>{i18n.t('Horizon summary has not been computed yet.')}</p>
                        <Button
                            primary
                            onClick={onComputeHorizon}
                            loading={isComputingHorizon || isExplanationJobRunning}
                            disabled={!localOrgUnit || isComputingHorizon || isExplanationJobRunning}
                        >
                            {i18n.t('Compute Horizon Summary')}
                        </Button>
                    </div>
                ) : (
                    <div className={widgetStyles.chartContainer}>
                        {isHorizonLoading && (
                            <div className={widgetStyles.loadingOverlay}><CircularLoader small /></div>
                        )}
                        <div className={widgetStyles.chartHeader}>
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
                            <div className={widgetStyles.chartLoadingWrapper}>
                                <div className={widgetStyles.loadingOverlay}><CircularLoader small /></div>
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
                            <div className={widgetStyles.emptyState}>
                                <p>{beeswarmError ?? i18n.t('SHAP summary data not yet computed.')}</p>
                                <Button small primary onClick={onComputeBeeswarm}>{i18n.t('Compute')}</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
