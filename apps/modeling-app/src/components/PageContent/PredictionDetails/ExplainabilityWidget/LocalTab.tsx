import { useEffect, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, CircularLoader, NoticeBox, SingleSelectField, SingleSelectOption, Menu, MenuItem } from '@dhis2/ui';
import {
    CovariateProvenanceRead,
    FeatureImportanceChart,
    ShapBeeswarmChart,
    ShapWaterfallChart,
    type LocalExplanationResponse,
    type ShapBeeswarmResponse,
} from '@dhis2-chap/ui';
import widgetStyles from './ExplainabilityWidget.module.css';
import styles from './LocalTab.module.css';

type OrgUnitOption = { id: string; label: string };

type Props = {
    orgUnitOptions: OrgUnitOption[];
    localOrgUnit: string;
    onOrgUnitChange: (id: string) => void;
    periods: string[];
    selectedPeriod: string;
    onPeriodChange: (period: string) => void;
    getPeriodLabel: (period: string) => string;
    displayExplanation: LocalExplanationResponse | null;
    isLocalLoading: boolean;
    isLocalFetching: boolean;
    localError: unknown;
    isComputingLocal: boolean;
    isTransitioning: boolean;
    isExplanationJobRunning: boolean;
    supports: (viz: string) => boolean;
    beeswarmData: ShapBeeswarmResponse | undefined;
    isBeeswarmLoading: boolean;
    beeswarmError?: string | null;
    orgUnitMap: Record<string, string>;
    methodDisplayName: string;
    onRunExplanations: () => void;
    onLoadBeeswarm: () => void;
    onComputeLocal: () => void;
};

export const LocalTab = ({
    orgUnitOptions,
    localOrgUnit,
    onOrgUnitChange,
    periods,
    selectedPeriod,
    onPeriodChange,
    getPeriodLabel,
    displayExplanation,
    isLocalLoading,
    isLocalFetching,
    localError,
    isComputingLocal,
    isTransitioning,
    isExplanationJobRunning,
    supports,
    beeswarmData,
    isBeeswarmLoading,
    beeswarmError,
    orgUnitMap,
    methodDisplayName,
    onRunExplanations,
    onLoadBeeswarm,
    onComputeLocal,
}: Props) => {
    const defaultLocalView: 'waterfall' | 'summary' = supports('waterfall') ? 'waterfall' : 'summary';
    const [localView, setLocalView] = useState<'waterfall' | 'summary'>(defaultLocalView);
    useEffect(() => {
        setLocalView(defaultLocalView);
    }, [defaultLocalView]);
    const covariateProvenance = displayExplanation?.covariateProvenance;

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
                {periods.length === 0 ? (
                    <div className={widgetStyles.emptyState}>
                        <p>{i18n.t('No forecast periods are available for this prediction.')}</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.selectors}>
                            <div className={styles.selectorGroup}>
                                <SingleSelectField
                                    label={i18n.t('Period')}
                                    selected={selectedPeriod}
                                    onChange={({ selected }) => onPeriodChange(selected)}
                                    dense
                                >
                                    {periods.map(p => <SingleSelectOption key={p} label={getPeriodLabel(p)} value={p} />)}
                                </SingleSelectField>
                            </div>
                        </div>

                        {covariateProvenance && covariateProvenance.source !== CovariateProvenanceRead.source.DATASET_MATCH ? (
                            <NoticeBox title={i18n.t('About feature values')}>
                                {covariateProvenance.detail}
                            </NoticeBox>
                        ) : (
                            <p className={styles.dataSourceNote}>
                                {i18n.t('Feature values are taken from the dataset row that matches the forecast period when available.')}
                            </p>
                        )}

                        {(isLocalLoading || isLocalFetching || isComputingLocal || (isExplanationJobRunning && !displayExplanation)) && !displayExplanation ? (
                            <div className={widgetStyles.loadingContainer}><CircularLoader small /></div>
                        ) : localError && !displayExplanation ? (
                            <NoticeBox error title={i18n.t('Error')}>{i18n.t('Failed to load local explanation')}</NoticeBox>
                        ) : displayExplanation ? (
                            <div className={widgetStyles.chartContainer}>
                                {(isLocalFetching || isComputingLocal || isTransitioning) && (
                                    <div className={widgetStyles.loadingOverlay}><CircularLoader small /></div>
                                )}
                                <div className={widgetStyles.chartHeader}>
                                    {(supports('waterfall') || supports('beeswarm')) && (
                                        <ButtonStrip>
                                            {supports('waterfall') && (
                                                <Button
                                                    small
                                                    primary={localView === 'waterfall'}
                                                    onClick={() => setLocalView('waterfall')}
                                                >
                                                    {i18n.t('Waterfall')}
                                                </Button>
                                            )}
                                            {supports('beeswarm') && (
                                                <Button
                                                    small
                                                    primary={localView === 'summary'}
                                                    onClick={() => setLocalView('summary')}
                                                >
                                                    {i18n.t('SHAP Summary')}
                                                </Button>
                                            )}
                                        </ButtonStrip>
                                    )}
                                    <Button small secondary onClick={onRunExplanations} loading={isExplanationJobRunning} disabled={isExplanationJobRunning}>
                                        {i18n.t('Recalculate')}
                                    </Button>
                                </div>
                                {supports('waterfall') && localView === 'waterfall' ? (
                                    <ShapWaterfallChart
                                        features={displayExplanation.featureAttributions.map(f => ({
                                            featureName: f.featureName, importance: f.importance,
                                            direction: f.direction, actualValue: f.actualValue,
                                        }))}
                                        baselinePrediction={displayExplanation.baselinePrediction}
                                        actualPrediction={displayExplanation.actualPrediction}
                                        title={i18n.t('SHAP Waterfall — {{orgUnit}}, {{period}}', {
                                            orgUnit: orgUnitMap[localOrgUnit] ?? localOrgUnit,
                                            period: getPeriodLabel(selectedPeriod),
                                        })}
                                    />
                                ) : supports('beeswarm') && localView === 'summary' ? (
                                    isBeeswarmLoading ? (
                                        <div className={widgetStyles.loadingContainer}><CircularLoader small /></div>
                                    ) : beeswarmData ? (
                                        <ShapBeeswarmChart
                                            points={beeswarmData.points.filter(p => p.orgUnit === localOrgUnit)}
                                            featureNames={beeswarmData.featureNames}
                                            highlightOrgUnit={localOrgUnit}
                                            highlightPeriod={selectedPeriod}
                                            orgUnitMap={orgUnitMap}
                                            title={i18n.t('SHAP Summary — {{orgUnit}}, {{period}} highlighted', {
                                                orgUnit: orgUnitMap[localOrgUnit] ?? localOrgUnit,
                                                period: getPeriodLabel(selectedPeriod),
                                            })}
                                        />
                                    ) : (
                                        <div className={widgetStyles.emptyState}>
                                            <p>{beeswarmError ?? i18n.t('SHAP summary data not yet loaded.')}</p>
                                            <Button small primary onClick={onLoadBeeswarm}>{i18n.t('Load')}</Button>
                                        </div>
                                    )
                                ) : (
                                    <>
                                        <NoticeBox>
                                            {i18n.t('{{method}} attributions are shown as feature contributions and may not decompose additively into the final prediction (unlike SHAP).', { method: methodDisplayName })}
                                        </NoticeBox>
                                        <FeatureImportanceChart
                                            features={displayExplanation.featureAttributions.map(f => ({
                                                featureName: f.featureName, importance: f.importance, direction: f.direction,
                                            }))}
                                            title={i18n.t('{{method}} Feature Contributions — {{orgUnit}}, {{period}}', {
                                                method: methodDisplayName,
                                                orgUnit: orgUnitMap[localOrgUnit] ?? localOrgUnit,
                                                period: getPeriodLabel(selectedPeriod),
                                            })}
                                        />
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className={widgetStyles.emptyState}>
                                <p>{i18n.t('No explanation available for this selection.')}</p>
                                <Button primary onClick={onComputeLocal} loading={isComputingLocal} disabled={isComputingLocal || !localOrgUnit || !selectedPeriod}>
                                    {i18n.t('Explain This Forecast')}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
