import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox, TabBar, Tab } from '@dhis2/ui';
import {
    Widget,
    XaiService,
    DEFAULT_XAI_METHOD,
    JobsService,
    type HorizonSummaryResponse,
    type ShapBeeswarmResponse,
} from '@dhis2-chap/ui';
import { useGlobalExplanation } from '@/hooks/useGlobalExplanation';
import { useLocalExplanation } from '@/hooks/useLocalExplanation';
import { useOrgUnitsById } from '../../../../hooks/useOrgUnitsById';
import { useXaiMethods } from '../../../../hooks/useXaiMethods';
import { XaiMethodSelector } from './XaiMethodSelector';
import { getPeriodLabel } from './getPeriodLabel';
import { GlobalTab } from './GlobalTab';
import { LocalTab } from './LocalTab';
import { HorizonTab } from './HorizonTab';
import styles from './ExplainabilityWidget.module.css';

type Props = {
    predictionId: number;
    modelId?: string;
    orgUnits: string[];
    periods: string[];
    periodType?: string | null;
    selectedOrgUnit?: string;
    onOrgUnitChange?: (orgUnit: string) => void;
};

export const ExplainabilityWidget = ({
    predictionId,
    modelId,
    orgUnits,
    periods,
    periodType,
    selectedOrgUnit,
    onOrgUnitChange,
}: Props) => {
    const [open, setOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'global' | 'local' | 'horizon'>('global');
    const [selectedPeriod, setSelectedPeriod] = useState<string>(periods[0] || '');
    const [localOrgUnit, setLocalOrgUnit] = useState<string>(selectedOrgUnit || orgUnits[0] || '');
    const hasUserSelectedOrgUnit = useRef(false);
    const [selectedXaiMethod, setSelectedXaiMethod] = useState<string>(DEFAULT_XAI_METHOD);
    const hasUserSelectedXaiMethod = useRef(false);
    const [explanationJobId, setExplanationJobId] = useState<string | null>(null);
    const [completedExplanationMethods, setCompletedExplanationMethods] = useState<Record<string, boolean>>({});
    const queryClient = useQueryClient();

    const { xaiMethods, isLoading: isXaiMethodsLoading } = useXaiMethods();

    useEffect(() => {
        if (!xaiMethods?.length || hasUserSelectedXaiMethod.current) return;

        const normalizedModelId = modelId?.toLowerCase();
        const methodScore = (method: (typeof xaiMethods)[number]) => {
            const methodType = method.methodType?.toLowerCase() ?? '';
            const methodName = method.name?.toLowerCase() ?? '';
            const description = method.description?.toLowerCase() ?? '';
            const isNative = methodType.includes('native') || methodName.includes('native');
            const isAuto = methodType.includes('auto') || methodName.includes('auto');
            const matchesModel =
                !!normalizedModelId &&
                (methodName.includes(normalizedModelId) || description.includes(normalizedModelId));

            if (!isNative) return -1;
            return (matchesModel ? 10 : 0) + (isAuto ? 3 : 0);
        };

        const preferredNativeMethod = [...xaiMethods]
            .sort((a, b) => methodScore(b) - methodScore(a))
            .find((method) => methodScore(method) >= 0);

        if (preferredNativeMethod && preferredNativeMethod.name !== selectedXaiMethod) {
            setSelectedXaiMethod(preferredNativeMethod.name);
        }
    }, [xaiMethods, selectedXaiMethod, modelId]);

    const selectedXaiMethodObj = xaiMethods?.find(m => m.name === selectedXaiMethod);
    const selectedMethod = selectedXaiMethodObj?.methodType === 'surrogate_lime' ? 'lime' : 'shap';

    // Falls back to method-type inference when supportedVisualizations is not yet populated
    // (e.g. after upgrading a server that hasn't reseeded the DB yet).
    const supports = (viz: string): boolean => {
        const declared = selectedXaiMethodObj?.supportedVisualizations;
        if (declared && declared.length > 0) {
            return declared.includes(viz);
        }
        if (viz === 'importance') return true;
        return selectedMethod === 'shap';
    };

    const [horizonData, setHorizonData] = useState<HorizonSummaryResponse | null>(null);
    const [horizonOrgUnit, setHorizonOrgUnit] = useState<string>('');
    const [isHorizonLoading, setIsHorizonLoading] = useState(false);
    const [horizonError, setHorizonError] = useState<string | null>(null);
    const [explanationRunError, setExplanationRunError] = useState<string | null>(null);

    const [beeswarmData, setBeeswarmData] = useState<ShapBeeswarmResponse | null>(null);
    const [isBeeswarmLoading, setIsBeeswarmLoading] = useState(false);
    const [globalView, setGlobalView] = useState<'importance' | 'beeswarm'>('importance');
    const [localView, setLocalView] = useState<'waterfall' | 'summary'>('waterfall');
    const [horizonView, setHorizonView] = useState<'importance' | 'beeswarm'>('importance');

    const {
        globalExplanation,
        isLoading: isGlobalLoading,
        isFetching: isGlobalFetching,
        error: globalError,
        isComputing: isComputingGlobal,
    } = useGlobalExplanation(predictionId, selectedXaiMethod);

    const {
        currentExplanation: localExplanation,
        isLoading: isLocalLoading,
        isFetching: isLocalFetching,
        error: localError,
        computeExplanation: computeLocal,
        isComputing: isComputingLocal,
    } = useLocalExplanation(predictionId, localOrgUnit, selectedPeriod, selectedMethod, selectedXaiMethod);

    const prevExplanationRef = useRef(localExplanation);
    if (localExplanation) {
        prevExplanationRef.current = localExplanation;
    }
    const displayExplanation =
        localExplanation ??
        (prevExplanationRef.current?.period === selectedPeriod &&
        prevExplanationRef.current?.orgUnit === localOrgUnit
            ? prevExplanationRef.current
            : null);
    const isTransitioning =
        !!displayExplanation &&
        !localExplanation &&
        prevExplanationRef.current?.period === selectedPeriod &&
        prevExplanationRef.current?.orgUnit === localOrgUnit;

    const { data: orgUnitsData } = useOrgUnitsById(orgUnits);

    const orgUnitOptions = useMemo(
        () =>
            orgUnits.map(id => {
                const found = orgUnitsData?.organisationUnits.find(ou => ou.id === id);
                return { id, label: found?.displayName ?? id };
            }).sort((a, b) => a.label.localeCompare(b.label)),
        [orgUnits, orgUnitsData],
    );

    const orgUnitMap = useMemo(
        () => Object.fromEntries(orgUnitOptions.map(o => [o.id, o.label])),
        [orgUnitOptions],
    );

    useEffect(() => {
        if (!hasUserSelectedOrgUnit.current && orgUnitOptions.length > 0 && orgUnitsData) {
            const firstSorted = orgUnitOptions[0].id;
            if (firstSorted !== localOrgUnit) {
                setLocalOrgUnit(firstSorted);
                setHorizonOrgUnit('');
                onOrgUnitChange?.(firstSorted);
            }
        }
    }, [orgUnitOptions, orgUnitsData]);

    const getLabel = (period: string) => getPeriodLabel(period, periodType);

    const {
        data: explanationJobStatus,
    } = useQuery({
        queryKey: ['jobStatus', explanationJobId],
        queryFn: () => JobsService.getJobStatusJobsJobIdGet(explanationJobId!),
        enabled: !!explanationJobId,
        refetchInterval: (data) =>
            data === 'SUCCESS' || data === 'FAILURE' || data === 'REVOKED' ? false : 2000,
    });

    const isExplanationJobRunning =
        !!explanationJobId
        && explanationJobStatus !== 'SUCCESS'
        && explanationJobStatus !== 'FAILURE'
        && explanationJobStatus !== 'REVOKED';
    const hasCompletedExplanationsForMethod = !!completedExplanationMethods[selectedXaiMethod];

    const handleRunExplanations = async () => {
        if (!predictionId || isExplanationJobRunning) return;
        setExplanationRunError(null);
        try {
            const job = await XaiService.runExplanations(predictionId, selectedXaiMethod, 'median', 10);
            setExplanationJobId(job.id);
        } catch (e: any) {
            setExplanationRunError(e?.message || 'Failed to start explanation run');
        }
    };

    const prevXaiMethodRef = useRef(selectedXaiMethod);
    useEffect(() => {
        if (prevXaiMethodRef.current !== selectedXaiMethod) {
            prevXaiMethodRef.current = selectedXaiMethod;
            setExplanationJobId(null);
            setBeeswarmData(null);
            setHorizonData(null);
            setHorizonOrgUnit('');
            if (!supports('beeswarm')) {
                setGlobalView('importance');
                setLocalView('waterfall');
                setHorizonView('importance');
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedXaiMethod]);

    const handleComputeLocal = (force: boolean = false) => {
        computeLocal({
            orgUnit: localOrgUnit,
            period: selectedPeriod,
            method: selectedMethod,
            xaiMethod: selectedXaiMethod,
            topK: 10,
            force,
        });
    };

    const handleComputeHorizon = async (orgUnit?: string) => {
        const ou = orgUnit || localOrgUnit;
        if (!predictionId || !ou) return;
        setIsHorizonLoading(true);
        setHorizonError(null);
        try {
            const result = await XaiService.computeHorizonSummary(predictionId, ou, 'median', selectedMethod, selectedXaiMethod);
            setHorizonData(result);
            setHorizonOrgUnit(ou);
        } catch (e: any) {
            setHorizonError(e?.message || 'Failed to compute horizon summary');
        } finally {
            setIsHorizonLoading(false);
        }
    };

    const handleLoadBeeswarm = async () => {
        if (!predictionId || beeswarmData || isBeeswarmLoading) return;
        setIsBeeswarmLoading(true);
        try {
            const result = await XaiService.computeShapBeeswarm(predictionId, 'median', selectedXaiMethod);
            setBeeswarmData(result);
        } catch { /* silently fail — chart just won't show */ }
        finally { setIsBeeswarmLoading(false); }
    };

    useEffect(() => {
        if (
            hasCompletedExplanationsForMethod &&
            activeTab === 'local'
            && !isExplanationJobRunning
            && !isLocalLoading
            && !isLocalFetching
            && !localExplanation
            && !isComputingLocal
            && localOrgUnit
            && selectedPeriod
        ) {
            handleComputeLocal(false);
        }
    }, [activeTab, localOrgUnit, selectedPeriod, selectedXaiMethod, isLocalLoading, isLocalFetching, localExplanation, isComputingLocal, isExplanationJobRunning, hasCompletedExplanationsForMethod]);

    useEffect(() => {
        if (!explanationJobId) return;
        if (explanationJobStatus === 'SUCCESS') {
            setCompletedExplanationMethods((prev) => ({ ...prev, [selectedXaiMethod]: true }));
            queryClient.invalidateQueries({ queryKey: ['globalExplanation', predictionId, selectedXaiMethod] });
            queryClient.invalidateQueries({ queryKey: ['localExplanations', predictionId] });
            setHorizonOrgUnit('');
            setHorizonData(null);
            setBeeswarmData(null);
            handleComputeHorizon(localOrgUnit);
            setExplanationJobId(null);
        }
        if (explanationJobStatus === 'FAILURE') {
            setExplanationRunError(i18n.t('Explanation job failed. Check Jobs for details.'));
            setExplanationJobId(null);
        }
    }, [explanationJobId, explanationJobStatus, predictionId, selectedXaiMethod, queryClient, localOrgUnit]);

    useEffect(() => {
        if (globalExplanation?.available) {
            setCompletedExplanationMethods((prev) => ({ ...prev, [selectedXaiMethod]: true }));
        }
    }, [globalExplanation?.available, selectedXaiMethod]);

    useEffect(() => {
        if (hasCompletedExplanationsForMethod && activeTab === 'horizon' && !isExplanationJobRunning && !isHorizonLoading && localOrgUnit && localOrgUnit !== horizonOrgUnit) {
            handleComputeHorizon(localOrgUnit);
        }
    }, [activeTab, localOrgUnit, horizonOrgUnit, isHorizonLoading, isExplanationJobRunning, hasCompletedExplanationsForMethod]);

    useEffect(() => {
        const needsBeeswarm =
            (activeTab === 'global' && globalView === 'beeswarm') ||
            (activeTab === 'local' && localView === 'summary' && supports('beeswarm')) ||
            (activeTab === 'horizon' && horizonView === 'beeswarm');
        if (needsBeeswarm && !beeswarmData && !isBeeswarmLoading) {
            handleLoadBeeswarm();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, globalView, localView, selectedXaiMethod, beeswarmData, isBeeswarmLoading, horizonView]);

    const handleOrgUnitChange = (value: string) => {
        hasUserSelectedOrgUnit.current = true;
        setLocalOrgUnit(value);
        onOrgUnitChange?.(value);
    };

    const isExplanationBundleReady = hasCompletedExplanationsForMethod;

    const renderActiveTab = () => {
        if (!isExplanationBundleReady && !isExplanationJobRunning) {
            return (
                <div className={styles.emptyState}>
                    <p>
                        {i18n.t('Generate explanations to view Global, Local, and Horizon plots.')}
                    </p>
                    <Button primary onClick={handleRunExplanations} loading={isExplanationJobRunning} disabled={isExplanationJobRunning}>
                        {i18n.t('Compute Explanation')}
                    </Button>
                </div>
            );
        }

        const sharedProps = {
            orgUnitOptions,
            localOrgUnit,
            onOrgUnitChange: handleOrgUnitChange,
            beeswarmData,
            isBeeswarmLoading,
            orgUnitMap,
            isExplanationJobRunning,
            supports,
            onRunExplanations: handleRunExplanations,
            onLoadBeeswarm: handleLoadBeeswarm,
        };

        switch (activeTab) {
            case 'global':
                return (
                    <GlobalTab
                        {...sharedProps}
                        isGlobalLoading={isGlobalLoading}
                        isGlobalFetching={isGlobalFetching}
                        globalError={globalError}
                        globalExplanation={globalExplanation}
                        globalView={globalView}
                        onGlobalViewChange={setGlobalView}
                        selectedXaiMethodObj={selectedXaiMethodObj}
                        selectedXaiMethod={selectedXaiMethod}
                    />
                );
            case 'local':
                return (
                    <LocalTab
                        {...sharedProps}
                        periods={periods}
                        selectedPeriod={selectedPeriod}
                        onPeriodChange={setSelectedPeriod}
                        getPeriodLabel={getLabel}
                        displayExplanation={displayExplanation}
                        isLocalLoading={isLocalLoading}
                        isLocalFetching={isLocalFetching}
                        localError={localError}
                        isComputingLocal={isComputingLocal}
                        isTransitioning={isTransitioning}
                        localView={localView}
                        onLocalViewChange={setLocalView}
                        selectedXaiMethodObj={selectedXaiMethodObj}
                        selectedXaiMethod={selectedXaiMethod}
                    />
                );
            case 'horizon':
                return (
                    <HorizonTab
                        {...sharedProps}
                        horizonData={horizonData}
                        isHorizonLoading={isHorizonLoading}
                        horizonError={horizonError}
                        horizonView={horizonView}
                        onHorizonViewChange={setHorizonView}
                    />
                );
        }
    };

    return (
        <div className={styles.widgetContainer}>
            <Widget header={i18n.t('Explainability')} open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}>
                <div className={styles.content}>
                    <div className={styles.widgetToolbar}>
                        <XaiMethodSelector
                            xaiMethods={xaiMethods}
                            selectedMethodName={selectedXaiMethod}
                            onSelect={(method) => {
                                hasUserSelectedXaiMethod.current = true;
                                setSelectedXaiMethod(method.name);
                            }}
                            isLoading={isXaiMethodsLoading}
                        />
                        {explanationRunError && (
                            <NoticeBox error title={i18n.t('Explanation error')}>
                                {explanationRunError}
                            </NoticeBox>
                        )}
                        {(isExplanationJobRunning || isComputingGlobal || isComputingLocal || isHorizonLoading || isBeeswarmLoading) && (
                            <div className={styles.computingBanner}>
                                <CircularLoader extrasmall />
                                <span>
                                    {isExplanationJobRunning
                                        ? i18n.t('Generating global, local, and horizon explanations ({{method}})…', {
                                            method: selectedXaiMethodObj?.displayName ?? selectedXaiMethod,
                                        })
                                        : isComputingGlobal
                                        ? i18n.t('Training surrogate model ({{method}}) — this includes hyperparameter tuning and may take a moment…', {
                                            method: selectedXaiMethodObj?.displayName ?? selectedXaiMethod,
                                        })
                                        : isComputingLocal
                                        ? i18n.t('Computing local explanation ({{method}}) with hyperparameter tuning…', {
                                            method: selectedXaiMethodObj?.displayName ?? selectedXaiMethod,
                                        })
                                        : isHorizonLoading
                                        ? i18n.t('Computing horizon summary…')
                                        : i18n.t('Loading summary data…')}
                                </span>
                            </div>
                        )}
                    </div>
                    <TabBar className={styles.tabBar}>
                        <Tab selected={activeTab === 'global'} onClick={() => setActiveTab('global')}>
                            {i18n.t('Global')}
                            {(isComputingGlobal || isExplanationJobRunning || isGlobalFetching) && <CircularLoader extrasmall className={styles.tabSpinner} />}
                        </Tab>
                        <Tab selected={activeTab === 'local'} onClick={() => setActiveTab('local')}>
                            {i18n.t('Local')}
                            {(isComputingLocal || isExplanationJobRunning) && <CircularLoader extrasmall className={styles.tabSpinner} />}
                        </Tab>
                        <Tab selected={activeTab === 'horizon'} onClick={() => setActiveTab('horizon')}>
                            {i18n.t('Horizon')}
                            {(isHorizonLoading || isExplanationJobRunning) && <CircularLoader extrasmall className={styles.tabSpinner} />}
                        </Tab>
                    </TabBar>
                    <div className={styles.tabContent}>
                        {renderActiveTab()}
                    </div>
                </div>
            </Widget>
        </div>
    );
};
