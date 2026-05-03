import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader } from '@dhis2/ui';
import { getPeriodLabel } from '@dhis2-chap/ui';
import { useOrgUnitsById } from '@/hooks/useOrgUnitsById';
import {
    ExplainabilityWidgetComponent,
    type TabKey,
} from './ExplainabilityWidget.component';
import { GlobalTab } from './GlobalTab';
import { LocalTab, type LocalView } from './LocalTab';
import { HorizonTab } from './HorizonTab';
import { useGlobalExplanation } from './hooks/useGlobalExplanation';
import { useLocalExplanation } from './hooks/useLocalExplanation';
import { useXaiMethods } from './hooks/useXaiMethods';
import { useShapBeeswarm } from './hooks/useShapBeeswarm';
import { useHorizonSummary } from './hooks/useHorizonSummary';
import { useXaiExplanationJob } from './hooks/useXaiExplanationJob';
import styles from './ExplainabilityWidget.module.css';

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
    const [open, setOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('global');

    const [searchParams, setSearchParams] = useSearchParams();
    const initialXaiMethod = searchParams.get('xaiMethod');

    // undefined = "user has not made a choice yet"; non-undefined = explicit selection.
    const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined);
    const [localOrgUnit, setLocalOrgUnit] = useState<string | undefined>(undefined);
    const [selectedXaiMethod, setSelectedXaiMethod] = useState<string | undefined>(
        initialXaiMethod ?? undefined,
    );

    const { xaiMethods, isLoading: isXaiMethodsLoading } = useXaiMethods(predictionId);

    // Honour an explicit user selection when it is present in the method list;
    // otherwise prefer native → isAuto → first available.
    const effectiveXaiMethod = useMemo((): string => {
        if (!xaiMethods?.length) return selectedXaiMethod ?? '';
        if (selectedXaiMethod && xaiMethods.some(m => m.name === selectedXaiMethod)) {
            return selectedXaiMethod;
        }
        const pick = xaiMethods.find(m => m.isNative)
            ?? xaiMethods.find(m => m.isAuto)
            ?? xaiMethods[0];
        return pick.name;
    }, [xaiMethods, selectedXaiMethod]);

    const effectivePeriod = selectedPeriod ?? periods[0] ?? '';

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

    // Auto-select the first org unit once display names have loaded and the list is sorted.
    useEffect(() => {
        if (localOrgUnit !== undefined) return;
        if (!orgUnitsData || orgUnitOptions.length === 0) return;
        setLocalOrgUnit(orgUnitOptions[0].id);
    }, [orgUnitOptions, orgUnitsData, localOrgUnit]);

    const effectiveOrgUnit = localOrgUnit ?? '';

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
        xaiMethod: effectiveXaiMethod,
    });

    const selectedXaiMethodObj = xaiMethods?.find(m => m.name === effectiveXaiMethod);
    const supports = (viz: string): boolean =>
        selectedXaiMethodObj?.supportedVisualizations.includes(viz) ?? false;

    const {
        globalExplanation,
        isLoading: isGlobalLoading,
        isFetching: isGlobalFetching,
        isPreviousData: isGlobalPreviousData,
        error: globalError,
    } = useGlobalExplanation(predictionId, effectiveXaiMethod);

    const isGlobalTransitioning = isGlobalFetching && isGlobalPreviousData;
    const hasCompletedExplanationsForMethod =
        !!globalExplanation || hasJobSucceeded;

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
        effectiveOrgUnit,
        effectivePeriod,
        effectiveXaiMethod,
    );

    const isTransitioning = isLocalFetching && isLocalPreviousData;

    const beeswarmEnabled = hasCompletedExplanationsForMethod && supports('beeswarm');
    const {
        beeswarmData,
        isBeeswarmLoading,
        beeswarmError,
        computeBeeswarm,
    } = useShapBeeswarm({
        predictionId,
        xaiMethod: effectiveXaiMethod,
        enabled: beeswarmEnabled,
    });

    const horizonEnabled =
        hasCompletedExplanationsForMethod &&
        activeTab === 'horizon' &&
        !isExplanationRunning;
    const {
        horizonData,
        isHorizonLoading,
        horizonError,
        computeHorizon,
        isComputingHorizon,
    } = useHorizonSummary({
        predictionId,
        orgUnit: effectiveOrgUnit,
        xaiMethod: effectiveXaiMethod,
        enabled: horizonEnabled,
    });

    const handleComputeLocal = () => {
        computeLocal({
            orgUnit: effectiveOrgUnit,
            period: effectivePeriod,
            xaiMethod: effectiveXaiMethod,
            topK: 10,
            force: false,
        });
    };

    const computingMessage = getComputingMessage({
        isSurrogateRunning,
        isExplanationRunning,
        isComputingLocal,
        methodLabel: selectedXaiMethodObj?.displayName ?? effectiveXaiMethod,
    });

    const sharedTabProps = {
        orgUnitOptions,
        localOrgUnit: effectiveOrgUnit,
        onOrgUnitChange: (value: string) => setLocalOrgUnit(value),
        beeswarmData,
        isBeeswarmLoading,
        beeswarmError,
        orgUnitMap,
        isExplanationJobRunning: isAnyXaiJobRunning,
        supports,
        onRunExplanations: handleRunExplanations,
        onComputeBeeswarm: computeBeeswarm,
    };

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
            selectedXaiMethod={effectiveXaiMethod}
            isXaiMethodsLoading={isXaiMethodsLoading}
            onSelectXaiMethod={(method) => {
                setSelectedXaiMethod(method.name);
                setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('xaiMethod', method.name);
                    return next;
                }, { replace: true });
            }}
        >
            {!hasCompletedExplanationsForMethod && !isAnyXaiJobRunning ? (
                isCheckingForActiveJobs ? (
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
                )
            ) : activeTab === 'global' ? (
                <GlobalTab
                    {...sharedTabProps}
                    isGlobalLoading={isGlobalLoading}
                    isGlobalFetching={isGlobalFetching}
                    isGlobalTransitioning={isGlobalTransitioning}
                    globalError={globalError}
                    globalExplanation={globalExplanation}
                />
            ) : activeTab === 'local' ? (
                <LocalTab
                    key={`${effectiveXaiMethod}-${selectedXaiMethodObj?.defaultVisualization ?? 'waterfall'}`}
                    {...sharedTabProps}
                    periods={periods}
                    selectedPeriod={effectivePeriod}
                    onPeriodChange={(value: string) => setSelectedPeriod(value)}
                    getPeriodLabel={period => getPeriodLabel(period, periodType)}
                    displayExplanation={localExplanation ?? null}
                    isLocalLoading={isLocalLoading}
                    isLocalFetching={isLocalFetching}
                    localError={localError}
                    isComputingLocal={isComputingLocal}
                    isTransitioning={isTransitioning}
                    methodDisplayName={selectedXaiMethodObj?.displayName ?? effectiveXaiMethod}
                    defaultVisualization={(selectedXaiMethodObj?.defaultVisualization ?? 'waterfall') as LocalView}
                    onComputeLocal={handleComputeLocal}
                />
            ) : (
                <HorizonTab
                    {...sharedTabProps}
                    horizonData={horizonData}
                    isHorizonLoading={isHorizonLoading}
                    horizonError={horizonError}
                    onComputeHorizon={computeHorizon}
                    isComputingHorizon={isComputingHorizon}
                />
            )}
        </ExplainabilityWidgetComponent>
    );
};
