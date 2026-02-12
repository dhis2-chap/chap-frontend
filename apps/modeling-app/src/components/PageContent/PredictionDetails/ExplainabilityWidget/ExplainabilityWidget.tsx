import React, { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox, TabBar, Tab, SingleSelect, SingleSelectOption } from '@dhis2/ui';
import { Widget, FeatureImportanceChart, type FeatureAttribution } from '@dhis2-chap/ui';
import { useGlobalExplanation } from '@/hooks/useGlobalExplanation';
import { useLocalExplanation } from '@/hooks/useLocalExplanation';
import styles from './ExplainabilityWidget.module.css';

type Props = {
    predictionId: number;
    orgUnits: string[];
    periods: string[];
    selectedOrgUnit?: string;
    onOrgUnitChange?: (orgUnit: string) => void;
};

export const ExplainabilityWidget = ({
    predictionId,
    orgUnits,
    periods,
    selectedOrgUnit,
    onOrgUnitChange,
}: Props) => {
    const [open, setOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'global' | 'local'>('global');
    const [selectedPeriod, setSelectedPeriod] = useState<string>(periods[0] || '');
    const [localOrgUnit, setLocalOrgUnit] = useState<string>(selectedOrgUnit || orgUnits[0] || '');

    const {
        globalExplanation,
        isLoading: isGlobalLoading,
        error: globalError,
        computeExplanation: computeGlobal,
        isComputing: isComputingGlobal,
    } = useGlobalExplanation(predictionId);

    const {
        currentExplanation: localExplanation,
        isLoading: isLocalLoading,
        error: localError,
        computeExplanation: computeLocal,
        isComputing: isComputingLocal,
    } = useLocalExplanation(predictionId, localOrgUnit, selectedPeriod);

    const handleComputeGlobal = () => {
        computeGlobal({ topK: 10 });
    };

    const handleComputeLocal = (force: boolean = false) => {
        computeLocal({
            orgUnit: localOrgUnit,
            period: selectedPeriod,
            topK: 10,
            force,
        });
    };

    const handleOrgUnitChange = (value: string) => {
        setLocalOrgUnit(value);
        onOrgUnitChange?.(value);
    };

    const renderGlobalContent = () => {
        if (isGlobalLoading) {
            return (
                <div className={styles.loadingContainer}>
                    <CircularLoader small />
                </div>
            );
        }

        if (globalError) {
            return (
                <NoticeBox error title={i18n.t('Error')}>
                    {i18n.t('Failed to load global explanation')}
                </NoticeBox>
            );
        }

        if (!globalExplanation?.available || !globalExplanation?.topFeatures?.length) {
            return (
                <div className={styles.emptyState}>
                    <p>{i18n.t('No global explanation computed yet.')}</p>
                    <Button
                        primary
                        onClick={handleComputeGlobal}
                        loading={isComputingGlobal}
                        disabled={isComputingGlobal}
                    >
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
                    <Button
                        small
                        secondary
                        onClick={handleComputeGlobal}
                        loading={isComputingGlobal}
                        disabled={isComputingGlobal}
                    >
                        {i18n.t('Recalculate')}
                    </Button>
                </div>
                <FeatureImportanceChart
                    features={features}
                    title={i18n.t('Top Feature Drivers')}
                />
                {globalExplanation.stabilityScore !== undefined && (
                    <div className={styles.metadata}>
                        <span className={styles.metadataLabel}>
                            {i18n.t('Stability Score')}:
                        </span>
                        <span className={styles.metadataValue}>
                            {(globalExplanation.stabilityScore * 100).toFixed(1)}%
                        </span>
                    </div>
                )}
                <p className={styles.disclaimer}>
                    {i18n.t('Feature importance shows which inputs have the most influence on predictions. This does not imply causation.')}
                </p>
            </div>
        );
    };

    const renderLocalContent = () => {
        if (isLocalLoading) {
            return (
                <div className={styles.loadingContainer}>
                    <CircularLoader small />
                </div>
            );
        }

        if (localError) {
            return (
                <NoticeBox error title={i18n.t('Error')}>
                    {i18n.t('Failed to load local explanation')}
                </NoticeBox>
            );
        }

        return (
            <div className={styles.localContainer}>
                <div className={styles.selectors}>
                    <div className={styles.selectorGroup}>
                        <label className={styles.selectorLabel}>
                            {i18n.t('Organization Unit')}
                        </label>
                        <SingleSelect
                            selected={localOrgUnit}
                            onChange={({ selected }) => handleOrgUnitChange(selected as string)}
                            dense
                        >
                            {orgUnits.map((ou) => (
                                <SingleSelectOption key={ou} label={ou} value={ou} />
                            ))}
                        </SingleSelect>
                    </div>
                    <div className={styles.selectorGroup}>
                        <label className={styles.selectorLabel}>
                            {i18n.t('Period')}
                        </label>
                        <SingleSelect
                            selected={selectedPeriod}
                            onChange={({ selected }) => setSelectedPeriod(selected as string)}
                            dense
                        >
                            {periods.map((p) => (
                                <SingleSelectOption key={p} label={p} value={p} />
                            ))}
                        </SingleSelect>
                    </div>
                </div>

                {localExplanation ? (
                    <div className={styles.chartContainer}>
                        <div className={styles.chartHeader}>
                            <Button
                                small
                                secondary
                                onClick={() => handleComputeLocal(true)}
                                loading={isComputingLocal}
                                disabled={isComputingLocal}
                            >
                                {i18n.t('Recalculate')}
                            </Button>
                        </div>
                        <FeatureImportanceChart
                            features={localExplanation.featureAttributions.map((f: any) => ({
                                feature_name: f.feature_name || f.featureName,
                                importance: f.importance,
                                direction: f.direction,
                            }))}
                            title={i18n.t('Feature Contributions for {{orgUnit}}', {
                                orgUnit: localOrgUnit,
                            })}
                        />
                        <div className={styles.predictionComparison}>
                            <div className={styles.comparisonItem}>
                                <span className={styles.comparisonLabel}>
                                    {i18n.t('Baseline')}:
                                </span>
                                <span className={styles.comparisonValue}>
                                    {localExplanation.baselinePrediction.toFixed(1)}
                                </span>
                            </div>
                            <div className={styles.comparisonItem}>
                                <span className={styles.comparisonLabel}>
                                    {i18n.t('Actual')}:
                                </span>
                                <span className={styles.comparisonValue}>
                                    {localExplanation.actualPrediction.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>
                            {i18n.t('No explanation available for this selection.')}
                        </p>
                        <Button
                            primary
                            onClick={() => handleComputeLocal(false)}
                            loading={isComputingLocal}
                            disabled={isComputingLocal || !localOrgUnit || !selectedPeriod}
                        >
                            {i18n.t('Explain This Forecast')}
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.widgetContainer}>
            <Widget
                header={i18n.t('Explainability')}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
            >
                <div className={styles.content}>
                    <TabBar className={styles.tabBar}>
                        <Tab
                            selected={activeTab === 'global'}
                            onClick={() => setActiveTab('global')}
                        >
                            {i18n.t('Global')}
                        </Tab>
                        <Tab
                            selected={activeTab === 'local'}
                            onClick={() => setActiveTab('local')}
                        >
                            {i18n.t('Local')}
                        </Tab>
                    </TabBar>
                    <div className={styles.tabContent}>
                        {activeTab === 'global' ? renderGlobalContent() : renderLocalContent()}
                    </div>
                </div>
            </Widget>
        </div>
    );
};
