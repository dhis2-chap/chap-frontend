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
import { type XaiMethodRead, getPeriodLabel } from '@dhis2-chap/ui';
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
import { useShapBeeswarm } from './hooks/useShapBeeswarm';
import { useHorizonSummary } from './hooks/useHorizonSummary';
import { useXaiExplanationJob } from './hooks/useXaiExplanationJob';
import styles from './ExplainabilityWidget.module.css';

// Matches the backend default; the methods endpoint already filters to those
// compatible with the prediction, so this is just a sensible initial guess.
const DEFAULT_XAI_METHOD = 'shap_auto';

type Props = {
    predictionId: number;
    orgUnits: string[];
    periods: string[];
    periodType?: string | null;
};

const getComputingMessage = ({
    isSurrogateRunning,
    isExplanationRunning,
    isComputingLocal,
    methodLabel,
}: {
    isSurrogateRunning: boolean;
    isExplanationRunning: boolean;
    isComputingLocal: boolean;
    methodLabel: string;
}): string | null => {
    if (isSurrogateRunning) {
        return i18n.t('Training surrogate model ({{method}})…', { method: methodLabel });
    }
    if (isExplanationRunning) {
        return i18n.t('Generating explanations ({{method}})…', { method: methodLabel });
    }
    if (isComputingLocal) return i18n.t('Computing local explanation…');
    return null;
};

export const ExplainabilityWidget = ({
    predictionId,
    orgUnits,
    periods,
    periodType,
}: Props) => {
    // UI state
    const [open, setOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('global');

    // Selections
    const [searchParams] = useSearchParams();
    const initialXaiMethod = searchParams.get('xaiMethod');
    const [selectedPeriod, setSelectedPeriod] = useState<string>(
        periods[0] || '',
    );
    const hasUserSelectedPeriod = useRef(false);
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
        hasJobSucceeded,
        isCheckingForActiveJobs,
        error: explanationRunError,
        run: handleRunExplanations,
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

    const supports = useCallback(
        (viz: string): boolean =>
            selectedXaiMethodObj?.supportedVisualizations.includes(viz) ?? false,
        [selectedXaiMethodObj],
    );

    // If the default method isn't in the (prediction-filtered) list, fall back
    // to the first auto method, then the first method overall.
    useEffect(() => {
        if (hasUserSelectedXaiMethod.current || !xaiMethods?.length) return;
        if (xaiMethods.some(m => m.name === selectedXaiMethod)) return;
        const fallback = xaiMethods.find(m => m.isAuto) ?? xaiMethods[0];
        setSelectedXaiMethod(fallback.name);
    }, [xaiMethods, selectedXaiMethod]);

    const handleSelectXaiMethod = (method: XaiMethodRead) => {
        hasUserSelectedXaiMethod.current = true;
        setSelectedXaiMethod(method.name);
    };

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
    const hasCompletedExplanationsForMethod =
        !!globalExplanation?.available || hasJobSucceeded;

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
        selectedXaiMethod,
    );

    const isTransitioning = isLocalFetching && isLocalPreviousData;

    // Beeswarm — fetched once explanations exist and the active method supports it.
    // Pre-fetched on tab arrival so switching to the SHAP Summary view is instant.
    const beeswarmEnabled =
        hasCompletedExplanationsForMethod && supports('beeswarm');
    const {
        beeswarmData,
        isBeeswarmLoading,
        beeswarmError,
        refetch: refetchBeeswarm,
    } = useShapBeeswarm({
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
        if (hasUserSelectedOrgUnit.current) return;
        if (!orgUnitsData || orgUnitOptions.length === 0) return;
        const firstSorted = orgUnitOptions[0].id;
        setLocalOrgUnit(prev => (prev === firstSorted ? prev : firstSorted));
    }, [orgUnitOptions, orgUnitsData]);
    useEffect(() => {
        if (hasUserSelectedPeriod.current) return;
        if (periods.length === 0) return;
        const first = periods[0];
        setSelectedPeriod(prev => (prev === first ? prev : first));
    }, [periods]);
    const handleOrgUnitChange = (value: string) => {
        hasUserSelectedOrgUnit.current = true;
        setLocalOrgUnit(value);
    };
    const handlePeriodChange = (value: string) => {
        hasUserSelectedPeriod.current = true;
        setSelectedPeriod(value);
    };

    const handleComputeLocal = () => {
        computeLocal({
            orgUnit: localOrgUnit,
            period: selectedPeriod,
            xaiMethod: selectedXaiMethod,
            topK: 10,
            force: false,
        });
    };

    const getLabel = (period: string) => getPeriodLabel(period, periodType);

    const computingMessage = getComputingMessage({
        isSurrogateRunning,
        isExplanationRunning,
        isComputingLocal,
        methodLabel: selectedXaiMethodObj?.displayName ?? selectedXaiMethod,
    });

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
                    />
                );
                break;
            case 'local':
                body = (
                    <LocalTab
                        {...sharedTabProps}
                        periods={periods}
                        selectedPeriod={selectedPeriod}
                        onPeriodChange={handlePeriodChange}
                        getPeriodLabel={getLabel}
                        displayExplanation={localExplanation ?? null}
                        isLocalLoading={isLocalLoading}
                        isLocalFetching={isLocalFetching}
                        localError={localError}
                        isComputingLocal={isComputingLocal}
                        isTransitioning={isTransitioning}
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
