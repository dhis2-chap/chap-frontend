import {
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader } from '@dhis2/ui';
import { DEFAULT_XAI_METHOD, type XaiMethodRead } from '@dhis2-chap/ui';
import { useGlobalExplanation } from '@/hooks/useGlobalExplanation';
import { useLocalExplanation } from '@/hooks/useLocalExplanation';
import { useOrgUnitsById } from '@/hooks/useOrgUnitsById';
import { useXaiMethods } from '@/hooks/useXaiMethods';
import {
    ExplainabilityWidgetComponent,
    type TabKey,
} from './ExplainabilityWidget.component';
import { GlobalTab } from './GlobalTab';
import { LocalTab } from './LocalTab';
import { HorizonTab } from './HorizonTab';
import { getPeriodLabel } from './getPeriodLabel';
import { useShapBeeswarm } from './hooks/useShapBeeswarm';
import { useHorizonSummary } from './hooks/useHorizonSummary';
import { useXaiExplanationJob } from './hooks/useXaiExplanationJob';
import styles from './ExplainabilityWidget.module.css';

type Props = {
    predictionId: number;
    modelId?: string;
    orgUnits: string[];
    periods: string[];
    periodType?: string | null;
};

export const ExplainabilityWidget = ({
    predictionId,
    modelId,
    orgUnits,
    periods,
    periodType,
}: Props) => {
    // UI state
    const [open, setOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('global');
    const [globalView, setGlobalView] = useState<'importance' | 'beeswarm'>(
        'importance',
    );
    const [localView, setLocalView] = useState<'waterfall' | 'summary'>(
        'waterfall',
    );
    const [horizonView, setHorizonView] = useState<'importance' | 'beeswarm'>(
        'importance',
    );

    // Selections
    const [searchParams] = useSearchParams();
    const initialXaiMethod = searchParams.get('xaiMethod');
    const [selectedPeriod, setSelectedPeriod] = useState<string>(
        periods[0] || '',
    );
    const [localOrgUnit, setLocalOrgUnit] = useState<string>(orgUnits[0] || '');
    const hasUserSelectedOrgUnit = useRef(false);
    const [selectedXaiMethod, setSelectedXaiMethod] = useState<string>(
        initialXaiMethod ?? DEFAULT_XAI_METHOD,
    );
    const hasUserSelectedXaiMethod = useRef(!!initialXaiMethod);

    // XAI explanation job lifecycle (id persistence, polling, terminal handling).
    const {
        isRunning: isAnyXaiJobRunning,
        isExplanationRunning,
        isSurrogateRunning,
        isComplete: hasCompletedExplanationsForMethod,
        isCheckingForActiveJobs,
        error: explanationRunError,
        run: handleRunExplanations,
        markComplete: markMethodComplete,
    } = useXaiExplanationJob({
        predictionId,
        xaiMethod: selectedXaiMethod,
    });

    // XAI methods
    const { xaiMethods, isLoading: isXaiMethodsLoading } =
        useXaiMethods(predictionId);
    const selectedXaiMethodObj = xaiMethods?.find(
        m => m.name === selectedXaiMethod,
    );
    const selectedMethod =
        selectedXaiMethodObj?.methodType === 'surrogate_lime' ? 'lime' : 'shap';

    // Falls back to method-type inference when supportedVisualizations is not yet
    // populated (e.g. after upgrading a server that hasn't reseeded the DB).
    const supports = useCallback(
        (viz: string): boolean => {
            const declared = selectedXaiMethodObj?.supportedVisualizations;
            if (declared && declared.length > 0) return declared.includes(viz);
            if (viz === 'importance') return true;
            return selectedMethod === 'shap';
        },
        [selectedXaiMethodObj, selectedMethod],
    );

    useEffect(() => {
        if (!xaiMethods?.length || hasUserSelectedXaiMethod.current) return;
        const lowerModelId = modelId?.toLowerCase();
        const isNative = (m: XaiMethodRead) =>
            (m.methodType?.toLowerCase() ?? '').includes('native')
            || (m.name?.toLowerCase() ?? '').includes('native');
        const matchesModel = (m: XaiMethodRead) =>
            !!lowerModelId &&
            ((m.name?.toLowerCase() ?? '').includes(lowerModelId)
                || (m.description?.toLowerCase() ?? '').includes(lowerModelId));
        const nativeMethods = xaiMethods.filter(isNative);
        if (!nativeMethods.length) return;
        const preferred =
            nativeMethods.find(matchesModel)
            ?? nativeMethods.find(m => m.name === 'native_shap')
            ?? nativeMethods[0];
        if (preferred.name !== selectedXaiMethod) {
            setSelectedXaiMethod(preferred.name);
        }
    }, [xaiMethods, selectedXaiMethod, modelId]);

    const handleSelectXaiMethod = (method: XaiMethodRead) => {
        hasUserSelectedXaiMethod.current = true;
        setSelectedXaiMethod(method.name);
    };

    // Reset visualization views when switching to a method without beeswarm support.
    const prevXaiMethodRef = useRef(selectedXaiMethod);
    useEffect(() => {
        if (prevXaiMethodRef.current === selectedXaiMethod) return;
        prevXaiMethodRef.current = selectedXaiMethod;
        if (!supports('beeswarm')) {
            setGlobalView('importance');
            setLocalView('waterfall');
            setHorizonView('importance');
        }
    }, [selectedXaiMethod, supports]);

    // Global / local explanation data — keepPreviousData on the queries means
    // the hook's `data` already holds the prior response while a new fetch is in
    // flight, and `isPreviousData` flags the transition.
    const {
        globalExplanation,
        isLoading: isGlobalLoading,
        isFetching: isGlobalFetching,
        isPreviousData: isGlobalPreviousData,
        error: globalError,
    } = useGlobalExplanation(predictionId, selectedXaiMethod);

    const isGlobalTransitioning = isGlobalFetching && isGlobalPreviousData;

    const {
        currentExplanation: localExplanation,
        isLoading: isLocalLoading,
        isFetching: isLocalFetching,
        isPreviousData: isLocalPreviousData,
        error: localError,
        computeExplanation: computeLocal,
        isComputing: isComputingLocal,
    } = useLocalExplanation(
        predictionId,
        localOrgUnit,
        selectedPeriod,
        selectedMethod,
        selectedXaiMethod,
    );

    const isTransitioning = isLocalFetching && isLocalPreviousData;

    // Beeswarm — fetched lazily based on which view is showing
    const beeswarmEnabled =
        hasCompletedExplanationsForMethod &&
        ((activeTab === 'global' && globalView === 'beeswarm')
            || (activeTab === 'local' &&
                localView === 'summary' &&
                supports('beeswarm'))
            || (activeTab === 'horizon' && horizonView === 'beeswarm'));
    const { beeswarmData, isBeeswarmLoading, beeswarmError, refetchBeeswarm } =
        useShapBeeswarm({
            predictionId,
            xaiMethod: selectedXaiMethod,
            enabled: beeswarmEnabled,
        });

    // Horizon — fetched once explanations exist and the horizon tab is active
    const horizonEnabled =
        hasCompletedExplanationsForMethod &&
        activeTab === 'horizon' &&
        !isExplanationRunning;
    const { horizonData, isHorizonLoading, horizonError } = useHorizonSummary({
        predictionId,
        orgUnit: localOrgUnit,
        method: selectedMethod,
        xaiMethod: selectedXaiMethod,
        enabled: horizonEnabled,
    });

    // Org units
    const { data: orgUnitsData } = useOrgUnitsById(orgUnits);
    const orgUnitOptions = useMemo(
        () =>
            orgUnits
                .map((id) => {
                    const found = orgUnitsData?.organisationUnits.find(
                        ou => ou.id === id,
                    );
                    return { id, label: found?.displayName ?? id };
                })
                .sort((a, b) => a.label.localeCompare(b.label)),
        [orgUnits, orgUnitsData],
    );
    const orgUnitMap = useMemo(
        () => Object.fromEntries(orgUnitOptions.map(o => [o.id, o.label])),
        [orgUnitOptions],
    );
    useEffect(() => {
        if (
            !hasUserSelectedOrgUnit.current &&
            orgUnitOptions.length > 0 &&
            orgUnitsData
        ) {
            const firstSorted = orgUnitOptions[0].id;
            if (firstSorted !== localOrgUnit) {
                setLocalOrgUnit(firstSorted);
            }
        }
    }, [orgUnitOptions, orgUnitsData]);
    const handleOrgUnitChange = (value: string) => {
        hasUserSelectedOrgUnit.current = true;
        setLocalOrgUnit(value);
    };

    // Mark a method as completed once its global explanation is available
    // (covers the case where the user opens a prediction whose explanations
    // were already computed before this session — no job to listen to).
    useEffect(() => {
        if (globalExplanation?.available) markMethodComplete();
    }, [globalExplanation?.available, markMethodComplete]);

    const handleComputeLocal = () => {
        computeLocal({
            orgUnit: localOrgUnit,
            period: selectedPeriod,
            method: selectedMethod,
            xaiMethod: selectedXaiMethod,
            topK: 10,
            force: false,
        });
    };

    const getLabel = (period: string) => getPeriodLabel(period, periodType);

    // Banner message
    const computingMessage = (() => {
        if (isSurrogateRunning) {
            return i18n.t('Training surrogate model ({{method}})…', {
                method: selectedXaiMethodObj?.displayName ?? selectedXaiMethod,
            });
        }
        if (isExplanationRunning) {
            return i18n.t('Generating explanations ({{method}})…', {
                method: selectedXaiMethodObj?.displayName ?? selectedXaiMethod,
            });
        }
        if (isComputingLocal) return i18n.t('Computing local explanation…');
        return null;
    })();

    // Body
    const isExplanationBundleReady = hasCompletedExplanationsForMethod;

    let body: ReactNode;
    if (!isExplanationBundleReady && !isAnyXaiJobRunning) {
        body = isCheckingForActiveJobs ? (
            <div className={styles.loadingContainer}>
                <CircularLoader small />
            </div>
        ) : (
            <div className={styles.emptyState}>
                <p>
                    {i18n.t(
                        'Generate explanations to view Global, Local, and Horizon plots.',
                    )}
                </p>
                <Button
                    primary
                    onClick={handleRunExplanations}
                    loading={isAnyXaiJobRunning}
                    disabled={isAnyXaiJobRunning}
                >
                    {i18n.t('Compute Explanation')}
                </Button>
            </div>
        );
    } else {
        const sharedTabProps = {
            orgUnitOptions,
            localOrgUnit,
            onOrgUnitChange: handleOrgUnitChange,
            beeswarmData,
            isBeeswarmLoading,
            beeswarmError,
            orgUnitMap,
            isExplanationJobRunning: isAnyXaiJobRunning,
            supports,
            onRunExplanations: handleRunExplanations,
            onLoadBeeswarm: refetchBeeswarm,
        };
        switch (activeTab) {
            case 'global':
                body = (
                    <GlobalTab
                        {...sharedTabProps}
                        isGlobalLoading={isGlobalLoading}
                        isGlobalFetching={isGlobalFetching}
                        isGlobalTransitioning={isGlobalTransitioning}
                        globalError={globalError}
                        globalExplanation={globalExplanation}
                        globalView={globalView}
                        onGlobalViewChange={setGlobalView}
                    />
                );
                break;
            case 'local':
                body = (
                    <LocalTab
                        {...sharedTabProps}
                        periods={periods}
                        selectedPeriod={selectedPeriod}
                        onPeriodChange={setSelectedPeriod}
                        getPeriodLabel={getLabel}
                        displayExplanation={localExplanation ?? null}
                        isLocalLoading={isLocalLoading}
                        isLocalFetching={isLocalFetching}
                        localError={localError}
                        isComputingLocal={isComputingLocal}
                        isTransitioning={isTransitioning}
                        localView={localView}
                        onLocalViewChange={setLocalView}
                        onComputeLocal={handleComputeLocal}
                    />
                );
                break;
            case 'horizon':
                body = (
                    <HorizonTab
                        {...sharedTabProps}
                        horizonData={horizonData}
                        isHorizonLoading={isHorizonLoading}
                        horizonError={horizonError}
                        horizonView={horizonView}
                        onHorizonViewChange={setHorizonView}
                    />
                );
                break;
        }
    }

    return (
        <ExplainabilityWidgetComponent
            open={open}
            onOpenChange={setOpen}
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            explanationRunError={explanationRunError}
            computingMessage={computingMessage}
            showGlobalTabSpinner={isAnyXaiJobRunning || isGlobalFetching}
            showLocalTabSpinner={isComputingLocal || isAnyXaiJobRunning}
            showHorizonTabSpinner={isHorizonLoading || isAnyXaiJobRunning}
            xaiMethods={xaiMethods}
            selectedXaiMethod={selectedXaiMethod}
            isXaiMethodsLoading={isXaiMethodsLoading}
            onSelectXaiMethod={handleSelectXaiMethod}
            body={body}
        />
    );
};
