import {
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import i18n from '@dhis2/d2-i18n'
import { Button, CircularLoader } from '@dhis2/ui'
import {
    XaiService,
    DEFAULT_XAI_METHOD,
    type XaiMethodRead,
} from '@dhis2-chap/ui'
import { useGlobalExplanation } from '@/hooks/useGlobalExplanation'
import { useLocalExplanation } from '@/hooks/useLocalExplanation'
import { useOrgUnitsById } from '@/hooks/useOrgUnitsById'
import { useXaiMethods } from '@/hooks/useXaiMethods'
import {
    ExplainabilityWidgetComponent,
    type TabKey,
} from './ExplainabilityWidget.component'
import { GlobalTab } from './GlobalTab'
import { LocalTab } from './LocalTab'
import { HorizonTab } from './HorizonTab'
import { getPeriodLabel } from './getPeriodLabel'
import { useActiveXaiJobs } from './hooks/useActiveXaiJobs'
import { useXaiJobStatus } from './hooks/useXaiJobStatus'
import { useShapBeeswarm } from './hooks/useShapBeeswarm'
import { useHorizonSummary } from './hooks/useHorizonSummary'
import { xaiJobStorage } from './hooks/xaiJobStorage'
import styles from './ExplainabilityWidget.module.css'

type Props = {
    predictionId: number
    predictionName: string
    modelId?: string
    orgUnits: string[]
    periods: string[]
    periodType?: string | null
}

export const ExplainabilityWidget = ({
    predictionId,
    predictionName,
    modelId,
    orgUnits,
    periods,
    periodType,
}: Props) => {
    // UI state
    const [open, setOpen] = useState(true)
    const [activeTab, setActiveTab] = useState<TabKey>('global')
    const [globalView, setGlobalView] = useState<'importance' | 'beeswarm'>(
        'importance'
    )
    const [localView, setLocalView] = useState<'waterfall' | 'summary'>(
        'waterfall'
    )
    const [horizonView, setHorizonView] = useState<'importance' | 'beeswarm'>(
        'importance'
    )

    // Selections
    const [searchParams] = useSearchParams()
    const initialXaiMethod = searchParams.get('xaiMethod')
    const [selectedPeriod, setSelectedPeriod] = useState<string>(
        periods[0] || ''
    )
    const [localOrgUnit, setLocalOrgUnit] = useState<string>(orgUnits[0] || '')
    const hasUserSelectedOrgUnit = useRef(false)
    const [selectedXaiMethod, setSelectedXaiMethod] = useState<string>(
        initialXaiMethod ?? DEFAULT_XAI_METHOD
    )
    const hasUserSelectedXaiMethod = useRef(!!initialXaiMethod)

    // Job state
    const [explanationJobId, setExplanationJobId] = useState<string | null>(
        () =>
            xaiJobStorage.get(
                predictionId,
                initialXaiMethod ?? DEFAULT_XAI_METHOD
            )
    )
    const [surrogateJobId, setSurrogateJobId] = useState<string | null>(null)
    const [completedExplanationMethods, setCompletedExplanationMethods] =
        useState<Record<string, boolean>>({})
    const [explanationRunError, setExplanationRunError] = useState<
        string | null
    >(null)
    const queryClient = useQueryClient()

    const hasCompletedExplanationsForMethod =
        !!completedExplanationMethods[selectedXaiMethod]

    // XAI methods
    const { xaiMethods, isLoading: isXaiMethodsLoading } =
        useXaiMethods(predictionId)
    const selectedXaiMethodObj = xaiMethods?.find(
        (m) => m.name === selectedXaiMethod
    )
    const selectedMethod =
        selectedXaiMethodObj?.methodType === 'surrogate_lime' ? 'lime' : 'shap'

    // Falls back to method-type inference when supportedVisualizations is not yet
    // populated (e.g. after upgrading a server that hasn't reseeded the DB).
    const supports = useCallback(
        (viz: string): boolean => {
            const declared = selectedXaiMethodObj?.supportedVisualizations
            if (declared && declared.length > 0) return declared.includes(viz)
            if (viz === 'importance') return true
            return selectedMethod === 'shap'
        },
        [selectedXaiMethodObj, selectedMethod]
    )

    useEffect(() => {
        if (!xaiMethods?.length || hasUserSelectedXaiMethod.current) return
        const lowerModelId = modelId?.toLowerCase()
        const isNative = (m: XaiMethodRead) =>
            (m.methodType?.toLowerCase() ?? '').includes('native') ||
            (m.name?.toLowerCase() ?? '').includes('native')
        const matchesModel = (m: XaiMethodRead) =>
            !!lowerModelId &&
            ((m.name?.toLowerCase() ?? '').includes(lowerModelId) ||
                (m.description?.toLowerCase() ?? '').includes(lowerModelId))
        const nativeMethods = xaiMethods.filter(isNative)
        if (!nativeMethods.length) return
        const preferred =
            nativeMethods.find(matchesModel) ??
            nativeMethods.find((m) => m.name === 'native_shap') ??
            nativeMethods[0]
        if (preferred.name !== selectedXaiMethod) {
            setSelectedXaiMethod(preferred.name)
        }
    }, [xaiMethods, selectedXaiMethod, modelId])

    const handleSelectXaiMethod = (method: XaiMethodRead) => {
        hasUserSelectedXaiMethod.current = true
        setSelectedXaiMethod(method.name)
    }

    // Reset transient job state when the user switches XAI method.
    // Beeswarm/horizon caches reset automatically via the queryKey changing.
    const prevXaiMethodRef = useRef(selectedXaiMethod)
    useEffect(() => {
        if (prevXaiMethodRef.current === selectedXaiMethod) return
        prevXaiMethodRef.current = selectedXaiMethod
        setExplanationJobId(xaiJobStorage.get(predictionId, selectedXaiMethod))
        setSurrogateJobId(null)
        if (!supports('beeswarm')) {
            setGlobalView('importance')
            setLocalView('waterfall')
            setHorizonView('importance')
        }
    }, [selectedXaiMethod, predictionId, supports])

    // Active job discovery — only when nothing's already running or done.
    const { explanationJobMatch, surrogateJobMatch, isCheckingForActiveJobs } =
        useActiveXaiJobs({
            predictionId,
            predictionName,
            xaiMethod: selectedXaiMethod,
            enabled:
                !explanationJobId &&
                !surrogateJobId &&
                !hasCompletedExplanationsForMethod,
        })
    useEffect(() => {
        if (explanationJobMatch && !explanationJobId) {
            setExplanationJobId(explanationJobMatch.id)
        }
    }, [explanationJobMatch, explanationJobId])
    useEffect(() => {
        if (surrogateJobMatch && !surrogateJobId && !explanationJobId) {
            setSurrogateJobId(surrogateJobMatch.id)
        }
    }, [surrogateJobMatch, surrogateJobId, explanationJobId])

    // Job status polling
    const explanationJob = useXaiJobStatus(explanationJobId)
    const surrogateJob = useXaiJobStatus(surrogateJobId)
    const isAnyXaiJobRunning =
        explanationJob.isRunning || surrogateJob.isRunning

    // Global / local explanation data
    const {
        globalExplanation,
        isLoading: isGlobalLoading,
        isFetching: isGlobalFetching,
        error: globalError,
    } = useGlobalExplanation(predictionId, selectedXaiMethod)

    const prevGlobalRef = useRef(globalExplanation)
    if (
        globalExplanation?.available &&
        globalExplanation?.topFeatures?.length
    ) {
        prevGlobalRef.current = globalExplanation
    }
    const displayGlobalExplanation =
        globalExplanation ??
        (isGlobalFetching || isGlobalLoading
            ? prevGlobalRef.current
            : undefined)
    const isGlobalTransitioning =
        !!displayGlobalExplanation &&
        displayGlobalExplanation !== globalExplanation &&
        (isGlobalFetching || isGlobalLoading)

    const {
        currentExplanation: localExplanation,
        isLoading: isLocalLoading,
        isFetching: isLocalFetching,
        error: localError,
        computeExplanation: computeLocal,
        isComputing: isComputingLocal,
    } = useLocalExplanation(
        predictionId,
        localOrgUnit,
        selectedPeriod,
        selectedMethod,
        selectedXaiMethod
    )

    const prevExplanationRef = useRef(localExplanation)
    if (localExplanation) prevExplanationRef.current = localExplanation
    const displayExplanation =
        localExplanation ??
        (isLocalFetching || isLocalLoading
            ? prevExplanationRef.current ?? null
            : null)
    const isTransitioning =
        !!displayExplanation &&
        !localExplanation &&
        (isLocalFetching || isLocalLoading)

    // Beeswarm — fetched lazily based on which view is showing
    const beeswarmEnabled =
        hasCompletedExplanationsForMethod &&
        ((activeTab === 'global' && globalView === 'beeswarm') ||
            (activeTab === 'local' &&
                localView === 'summary' &&
                supports('beeswarm')) ||
            (activeTab === 'horizon' && horizonView === 'beeswarm'))
    const { beeswarmData, isBeeswarmLoading, beeswarmError, refetchBeeswarm } =
        useShapBeeswarm({
            predictionId,
            xaiMethod: selectedXaiMethod,
            enabled: beeswarmEnabled,
        })

    // Horizon — fetched once explanations exist and the horizon tab is active
    const horizonEnabled =
        hasCompletedExplanationsForMethod &&
        activeTab === 'horizon' &&
        !explanationJob.isRunning
    const { horizonData, isHorizonLoading, horizonError } = useHorizonSummary({
        predictionId,
        orgUnit: localOrgUnit,
        method: selectedMethod,
        xaiMethod: selectedXaiMethod,
        enabled: horizonEnabled,
    })

    const prevHorizonRef = useRef(horizonData)
    if (horizonData) prevHorizonRef.current = horizonData
    const displayHorizonData = horizonData ?? (isHorizonLoading ? prevHorizonRef.current : null)

    // Org units
    const { data: orgUnitsData } = useOrgUnitsById(orgUnits)
    const orgUnitOptions = useMemo(
        () =>
            orgUnits
                .map((id) => {
                    const found = orgUnitsData?.organisationUnits.find(
                        (ou) => ou.id === id
                    )
                    return { id, label: found?.displayName ?? id }
                })
                .sort((a, b) => a.label.localeCompare(b.label)),
        [orgUnits, orgUnitsData]
    )
    const orgUnitMap = useMemo(
        () => Object.fromEntries(orgUnitOptions.map((o) => [o.id, o.label])),
        [orgUnitOptions]
    )
    useEffect(() => {
        if (
            !hasUserSelectedOrgUnit.current &&
            orgUnitOptions.length > 0 &&
            orgUnitsData
        ) {
            const firstSorted = orgUnitOptions[0].id
            if (firstSorted !== localOrgUnit) {
                setLocalOrgUnit(firstSorted)
            }
        }
    }, [orgUnitOptions, orgUnitsData])
    const handleOrgUnitChange = (value: string) => {
        hasUserSelectedOrgUnit.current = true
        setLocalOrgUnit(value)
    }

    // Mark a method as completed once its global explanation is available.
    useEffect(() => {
        if (globalExplanation?.available) {
            setCompletedExplanationMethods((prev) => ({
                ...prev,
                [selectedXaiMethod]: true,
            }))
        }
    }, [globalExplanation?.available, selectedXaiMethod])

    // Explanation job terminal handling
    useEffect(() => {
        if (!explanationJobId) return
        const status = explanationJob.status
        if (status === 'SUCCESS') {
            xaiJobStorage.clear(predictionId, selectedXaiMethod)
            setCompletedExplanationMethods((prev) => ({
                ...prev,
                [selectedXaiMethod]: true,
            }))
            queryClient.invalidateQueries({
                queryKey: [
                    'globalExplanation',
                    predictionId,
                    selectedXaiMethod,
                ],
            })
            queryClient.invalidateQueries({
                queryKey: ['localExplanations', predictionId],
            })
            queryClient.invalidateQueries({
                queryKey: ['shapBeeswarm', predictionId],
            })
            queryClient.invalidateQueries({
                queryKey: ['horizonSummary', predictionId],
            })
            setExplanationJobId(null)
        } else if (status === 'FAILURE') {
            xaiJobStorage.clear(predictionId, selectedXaiMethod)
            setExplanationRunError(
                i18n.t('Explanation job failed. Check Jobs for details.')
            )
            setExplanationJobId(null)
        } else if (status === 'REVOKED') {
            xaiJobStorage.clear(predictionId, selectedXaiMethod)
            setExplanationRunError(
                i18n.t('Explanation job was revoked. Check Jobs for details.')
            )
            setExplanationJobId(null)
        }
    }, [
        explanationJobId,
        explanationJob.status,
        predictionId,
        selectedXaiMethod,
        queryClient,
    ])

    // Surrogate job terminal handling
    useEffect(() => {
        if (!surrogateJobId) return
        const status = surrogateJob.status
        if (status === 'SUCCESS') {
            setSurrogateJobId(null)
        } else if (status === 'FAILURE') {
            setExplanationRunError(
                i18n.t(
                    'Surrogate model training failed. Check Jobs for details.'
                )
            )
            setSurrogateJobId(null)
        } else if (status === 'REVOKED') {
            setExplanationRunError(
                i18n.t(
                    'Surrogate model training was revoked. Check Jobs for details.'
                )
            )
            setSurrogateJobId(null)
        }
    }, [surrogateJobId, surrogateJob.status])

    // Handlers
    const handleRunExplanations = async () => {
        if (!predictionId || isAnyXaiJobRunning) return
        setExplanationRunError(null)
        try {
            const job = await XaiService.runExplanations(
                predictionId,
                selectedXaiMethod
            )
            xaiJobStorage.set(predictionId, selectedXaiMethod, job.id)
            setExplanationJobId(job.id)
        } catch (e) {
            setExplanationRunError(
                (e instanceof Error ? e.message : String(e)) ||
                    'Failed to start explanation run'
            )
        }
    }

    const handleComputeLocal = () => {
        computeLocal({
            orgUnit: localOrgUnit,
            period: selectedPeriod,
            method: selectedMethod,
            xaiMethod: selectedXaiMethod,
            topK: 10,
            force: false,
        })
    }

    const getLabel = (period: string) => getPeriodLabel(period, periodType)

    // Banner message
    const computingMessage = (() => {
        if (surrogateJob.isRunning) {
            return i18n.t('Training surrogate model ({{method}})…', {
                method: selectedXaiMethodObj?.displayName ?? selectedXaiMethod,
            })
        }
        if (explanationJob.isRunning) {
            return i18n.t('Generating explanations ({{method}})…', {
                method: selectedXaiMethodObj?.displayName ?? selectedXaiMethod,
            })
        }
        if (isComputingLocal) return i18n.t('Computing local explanation…')
        return null
    })()

    // Body
    const isExplanationBundleReady = hasCompletedExplanationsForMethod

    let body: ReactNode
    if (!isExplanationBundleReady && !isAnyXaiJobRunning) {
        body = isCheckingForActiveJobs ? (
            <div className={styles.loadingContainer}>
                <CircularLoader small />
            </div>
        ) : (
            <div className={styles.emptyState}>
                <p>
                    {i18n.t(
                        'Generate explanations to view Global, Local, and Horizon plots.'
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
        }
        switch (activeTab) {
            case 'global':
                body = (
                    <GlobalTab
                        {...sharedTabProps}
                        isGlobalLoading={isGlobalLoading}
                        isGlobalFetching={isGlobalFetching}
                        isGlobalTransitioning={isGlobalTransitioning}
                        globalError={globalError}
                        globalExplanation={displayGlobalExplanation}
                        globalView={globalView}
                        onGlobalViewChange={setGlobalView}
                    />
                )
                break
            case 'local':
                body = (
                    <LocalTab
                        {...sharedTabProps}
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
                        onComputeLocal={handleComputeLocal}
                    />
                )
                break
            case 'horizon':
                body = (
                    <HorizonTab
                        {...sharedTabProps}
                        horizonData={displayHorizonData}
                        isHorizonLoading={isHorizonLoading}
                        horizonError={horizonError}
                        horizonView={horizonView}
                        onHorizonViewChange={setHorizonView}
                    />
                )
                break
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
    )
}
