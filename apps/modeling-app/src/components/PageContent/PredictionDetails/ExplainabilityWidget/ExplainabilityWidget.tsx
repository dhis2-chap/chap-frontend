import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parse, addMonths, addWeeks, format, isValid, getISOWeekYear, getISOWeek } from 'date-fns';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox, TabBar, Tab, SingleSelect, SingleSelectOption, Menu, MenuItem, Tag } from '@dhis2/ui';
import {
    Widget,
    FeatureImportanceChart,
    ShapBeeswarmChart,
    ShapWaterfallChart,
    XaiService,
    DEFAULT_XAI_METHOD,
    JobsService,
    type FeatureAttribution,
    type HorizonSummaryResponse,
    type ShapBeeswarmResponse,
    convertServerToClientPeriod,
    PERIOD_TYPES,
} from '@dhis2-chap/ui';
import { useGlobalExplanation } from '@/hooks/useGlobalExplanation';
import { useLocalExplanation } from '@/hooks/useLocalExplanation';
import { useOrgUnitsById } from '../../../../hooks/useOrgUnitsById';
import { useXaiMethods } from '../../../../hooks/useXaiMethods';
import { XaiMethodSelector } from './XaiMethodSelector';
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

const formatFeatureName = (name: string): string =>
    name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const SurrogateQualityPanel = ({ quality, stabilityScore }: { quality?: any; stabilityScore?: number }) => {
    const [showInfo, setShowInfo] = useState(false);

    if (!quality) return null;
    const r2 = quality.rSquared ?? quality.r_squared;
    const mae = quality.mae;
    const mape = quality.mape;
    const n = quality.nSamples ?? quality.n_samples;
    const unique = quality.nUniqueRows ?? quality.n_unique_rows;
    const constantFeatures: string[] = quality.constantFeatures ?? quality.constant_features ?? [];
    const permRemovedFeatures: string[] = quality.permutationRemovedFeatures ?? quality.permutation_removed_features ?? [];
    const residualMean: number | null = quality.residualMean ?? quality.residual_mean ?? null;
    const residualStd: number | null = quality.residualStd ?? quality.residual_std ?? null;
    const fidelityTier: string = quality.fidelityTier ?? quality.fidelity_tier ?? (r2 == null ? 'poor' : r2 >= 0.8 ? 'good' : r2 >= 0.5 ? 'moderate' : 'poor');
    const fidelityWarning: string | null = quality.fidelityWarning ?? quality.fidelity_warning ?? null;
    const targetTransformMethod: string | null = quality.targetTransformMethod ?? quality.target_transform_method ?? null;
    const modelDisplayName: string = quality.selectedModelDisplayName ?? quality.selected_model_display_name ?? 'surrogate model';
    if (r2 == null) return null;

    const r2Pct = (r2 * 100).toFixed(1);
    const r2Color = fidelityTier === 'good' ? '#4caf50' : fidelityTier === 'moderate' ? '#ff9800' : '#f44336';
    const r2Label = fidelityTier === 'good' ? i18n.t('Good') : fidelityTier === 'moderate' ? i18n.t('Moderate') : i18n.t('Poor');
    const duplicateRatio = unique != null && n > 0 ? ((1 - unique / n) * 100).toFixed(0) : null;

    return (
        <div className={styles.qualityPanel}>
            <div className={styles.qualityHeaderRow}>
                <div className={styles.qualityHeader}>
                    {i18n.t('Surrogate Model Quality')}
                </div>
                <button
                    className={styles.qualityInfoBtn}
                    onClick={() => setShowInfo((v) => !v)}
                    title={i18n.t('What do these metrics mean?')}
                >
                    {showInfo ? i18n.t('Hide info') : i18n.t('What is this?')}
                </button>
            </div>

            {showInfo && (
                <div className={styles.qualityInfoBox}>
                    <p>
                        {i18n.t(
                            'Explanations are computed using a surrogate model ({{modelName}}) ' +
                            'that approximates the original prediction model. These metrics show how well ' +
                            'the surrogate reproduces the original model\'s predictions.',
                            { modelName: modelDisplayName }
                        )}
                    </p>
                    <dl className={styles.qualityInfoList}>
                        <dt>{i18n.t('CV R²')}</dt>
                        <dd>{i18n.t(
                            'Leave-one-out cross-validated R². Measures how much of the original model\'s ' +
                            'variance the surrogate captures. 100% = perfect replica, 0% = no better than predicting the mean.'
                        )}</dd>
                        <dt>{i18n.t('MAE')}</dt>
                        <dd>{i18n.t(
                            'Mean Absolute Error between the surrogate and original model predictions. ' +
                            'Lower is better — shows the average difference in prediction units.'
                        )}</dd>
                        <dt>{i18n.t('Residual bias')}</dt>
                        <dd>{i18n.t(
                            'Mean and standard deviation of (actual − predicted) LOO residuals. ' +
                            'A large mean indicates systematic over- or under-prediction by the surrogate.'
                        )}</dd>
                        <dt>{i18n.t('Samples')}</dt>
                        <dd>{i18n.t(
                            'Number of data points used to train the surrogate. More samples generally ' +
                            'produce more reliable explanations.'
                        )}</dd>
                        <dt>{i18n.t('Unique rows')}</dt>
                        <dd>{i18n.t(
                            'Number of distinct data points. If much lower than total samples, ' +
                            'many rows are duplicated, which can inflate apparent quality.'
                        )}</dd>
                        <dt>{i18n.t('Stability Score')}</dt>
                        <dd>{i18n.t(
                            'How stable the global feature ranking is across bootstrap resamples. ' +
                            'Higher means the same top features appear consistently.'
                        )}</dd>
                    </dl>
                </div>
            )}

            <div className={styles.qualityMetrics}>
                <div className={styles.qualityMetric}>
                    <span className={styles.qualityMetricLabel}>{i18n.t('CV R²')}</span>
                    <span className={styles.qualityMetricValue} style={{ color: r2Color }}>
                        {r2Pct}%
                    </span>
                    <span className={styles.qualityMetricRating} style={{ color: r2Color }}>
                        {r2Label}
                    </span>
                </div>
                {mae != null && (
                    <div className={styles.qualityMetric}>
                        <span className={styles.qualityMetricLabel}>{i18n.t('MAE')}</span>
                        <span className={styles.qualityMetricValue}>
                            {mae < 1 ? mae.toFixed(3) : mae.toFixed(1)}
                        </span>
                        {mape != null && (
                            <span className={styles.qualityMetricRating} style={{ color: 'var(--colors-grey600)' }}>
                                {(mape * 100).toFixed(1)}{i18n.t('% MAPE')}
                            </span>
                        )}
                    </div>
                )}
                {residualMean != null && residualStd != null && (
                    <div className={styles.qualityMetric}>
                        <span className={styles.qualityMetricLabel}>{i18n.t('Residual bias')}</span>
                        <span className={styles.qualityMetricValue} style={{ color: Math.abs(residualMean) > residualStd * 0.5 ? '#ff9800' : 'inherit' }}>
                            {residualMean >= 0 ? '+' : ''}{residualMean < 1 && residualMean > -1 ? residualMean.toFixed(3) : residualMean.toFixed(1)}
                        </span>
                        <span className={styles.qualityMetricRating} style={{ color: 'var(--colors-grey600)' }}>
                            {i18n.t('±{{std}}', { std: residualStd < 1 ? residualStd.toFixed(3) : residualStd.toFixed(1) })}
                        </span>
                    </div>
                )}
                <div className={styles.qualityMetric}>
                    <span className={styles.qualityMetricLabel}>{i18n.t('Samples')}</span>
                    <span className={styles.qualityMetricValue}>{n}</span>
                </div>
                {unique != null && (
                    <div className={styles.qualityMetric}>
                        <span className={styles.qualityMetricLabel}>{i18n.t('Unique rows')}</span>
                        <span className={styles.qualityMetricValue}>{unique}</span>
                        {duplicateRatio != null && Number(duplicateRatio) > 0 && (
                            <span className={styles.qualityMetricRating} style={{ color: 'var(--colors-grey600)' }}>
                                {i18n.t('{{pct}}% duplicated', { pct: duplicateRatio })}
                            </span>
                        )}
                    </div>
                )}
                {stabilityScore != null && (
                    <div className={styles.qualityMetric}>
                        <span className={styles.qualityMetricLabel}>{i18n.t('Stability Score')}</span>
                        <span className={styles.qualityMetricValue}>{(stabilityScore * 100).toFixed(1)}%</span>
                        <span className={styles.qualityMetricRating} style={{ color: 'var(--colors-grey600)' }}>
                            {i18n.t('ranking consistency')}
                        </span>
                    </div>
                )}
            </div>
            <div className={styles.qualityBar}>
                <div
                    className={styles.qualityBarFill}
                    style={{ width: `${Math.min(100, r2 * 100)}%`, background: r2Color }}
                />
            </div>
            <p className={styles.qualityNote}>
                {fidelityTier === 'poor'
                    ? i18n.t('The surrogate approximation is poor — explanations may not accurately reflect the original model. This often happens with very few data points.')
                    : fidelityTier === 'moderate'
                    ? i18n.t('The surrogate captures moderate signal. Explanations are directionally useful but approximate. Feature ranking is likely correct even if magnitudes are off.')
                    : i18n.t('The surrogate closely approximates the original model. Explanations are reliable.')}
            </p>
            {fidelityWarning && fidelityTier !== 'good' && (
                <NoticeBox warning>
                    {fidelityWarning}
                </NoticeBox>
            )}
            {targetTransformMethod && (
                <NoticeBox>
                    {i18n.t('Target transform applied{{colon}} {{method}}. SHAP values are rescaled back to the original prediction units; attributions are first-order approximations in the transformed space.', { colon: ':', method: targetTransformMethod })}
                </NoticeBox>
            )}
            {constantFeatures.length > 0 && (
                <NoticeBox warning title={i18n.t('Constant features detected')}>
                    {i18n.t('The following features have no variation in the training data and cannot contribute to explanations{{colon}} ', { colon: ':' })}
                    {constantFeatures.map(formatFeatureName).join(', ')}
                </NoticeBox>
            )}
            {permRemovedFeatures.length > 0 && (
                <NoticeBox title={i18n.t('Features removed by permutation selection')}>
                    {i18n.t('The following features were removed as noise by permutation importance selection{{colon}} ', { colon: ':' })}
                    {permRemovedFeatures.map(formatFeatureName).join(', ')}
                </NoticeBox>
            )}
        </div>
    );
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

    // Derive attribution method from the selected XAI method's methodType
    const selectedXaiMethodObj = xaiMethods?.find(m => m.name === selectedXaiMethod);
    const selectedMethod = selectedXaiMethodObj?.methodType === 'surrogate_lime' ? 'lime' : 'shap';

    // Returns true when the currently selected XAI method supports a given visualization type.
    // Falls back to method-type inference when supportedVisualizations is not yet populated
    // (e.g. after upgrading a server that hasn't reseeded the DB yet).
    const supports = (viz: string): boolean => {
        const declared = selectedXaiMethodObj?.supportedVisualizations;
        if (declared && declared.length > 0) {
            return declared.includes(viz);
        }
        // Graceful fallback: shap supports everything, lime only supports importance.
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

    const getPeriodLabel = (period: string) => {
        if (!periodType) return period;
        const [base, stepPart] = period.split('_');
        const step = stepPart ? Number(stepPart) : undefined;
        if (!step || Number.isNaN(step)) {
            try {
                return convertServerToClientPeriod(base, periodType as keyof typeof PERIOD_TYPES);
            } catch { return base; }
        }
        try {
            const upperType = periodType.toUpperCase();
            if (upperType === PERIOD_TYPES.MONTH) {
                const baseDate = parse(base, 'yyyyMM', new Date());
                if (!isValid(baseDate)) return base;
                const advanced = addMonths(baseDate, step);
                return format(advanced, 'yyyy-MM');
            }
            if (upperType === PERIOD_TYPES.WEEK) {
                const baseDate = parse(base, "RRRR'W'II", new Date());
                if (!isValid(baseDate)) return base;
                const advanced = addWeeks(baseDate, step);
                const isoYear = getISOWeekYear(advanced);
                const weekNum = getISOWeek(advanced);
                return `${isoYear}-W${String(weekNum).padStart(2, '0')}`;
            }
            return convertServerToClientPeriod(base, periodType as keyof typeof PERIOD_TYPES);
        } catch { return base; }
    };

    const handleComputeGlobal = () => { handleRunExplanations(); };

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

    // Reset cached data and unsupported view states when XAI method changes
    const prevXaiMethodRef = useRef(selectedXaiMethod);
    useEffect(() => {
        if (prevXaiMethodRef.current !== selectedXaiMethod) {
            prevXaiMethodRef.current = selectedXaiMethod;
            setExplanationJobId(null);
            setBeeswarmData(null);
            setHorizonData(null);
            setHorizonOrgUnit('');
            // Reset view toggles to a state that the new method supports
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

    const renderGlobalContent = () => {
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
                    <Button primary onClick={handleRunExplanations} loading={isExplanationJobRunning} disabled={isExplanationJobRunning}>
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
                                onClick={() => setGlobalView('importance')}
                            >
                                {i18n.t('Importance')}
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${globalView === 'beeswarm' ? styles.toggleBtnActive : ''}`}
                                onClick={() => setGlobalView('beeswarm')}
                            >
                                {i18n.t('SHAP Summary')}
                            </button>
                        </div>
                    ) : (
                        <Tag>{selectedXaiMethodObj?.displayName ?? selectedXaiMethod}</Tag>
                    )}
                    <Button small secondary onClick={handleRunExplanations} loading={isExplanationJobRunning} disabled={isExplanationJobRunning}>
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
                            <Button small primary onClick={handleLoadBeeswarm}>{i18n.t('Load')}</Button>
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

    const renderLocalContent = () => {
        return (
            <div className={styles.mainLayout}>
                <div className={styles.sidebar}>
                    <Menu dense>
                        {orgUnitOptions.map(o => (
                            <MenuItem
                                active={localOrgUnit === o.id}
                                key={o.id}
                                label={o.label}
                                onClick={() => handleOrgUnitChange(o.id)}
                            />
                        ))}
                    </Menu>
                </div>
                <div className={styles.plotArea}>
                <div className={styles.selectors}>
                    <div className={styles.selectorGroup}>
                        <label className={styles.selectorLabel}>{i18n.t('Period')}</label>
                        <SingleSelect selected={selectedPeriod} onChange={({ selected }) => setSelectedPeriod(selected as string)} dense>
                            {periods.map(p => <SingleSelectOption key={p} label={getPeriodLabel(p)} value={p} />)}
                        </SingleSelect>
                    </div>
                </div>

                {(() => {
                    const cp = displayExplanation?.covariateProvenance ?? (displayExplanation as { covariate_provenance?: { source?: string; detail?: string } })?.covariate_provenance;
                    if (cp?.detail && cp.source && cp.source !== 'dataset_match') {
                        return (
                            <NoticeBox title={i18n.t('About feature values')}>
                                {cp.detail}
                            </NoticeBox>
                        );
                    }
                    return (
                        <p className={styles.dataSourceNote}>
                            {i18n.t('Feature values are taken from the dataset row that matches the forecast period when available.')}
                        </p>
                    );
                })()}

                {(isLocalLoading || isLocalFetching || (isExplanationJobRunning && !displayExplanation)) && !displayExplanation ? (
                    <div className={styles.loadingContainer}><CircularLoader small /></div>
                ) : localError && !displayExplanation ? (
                    <NoticeBox error title={i18n.t('Error')}>{i18n.t('Failed to load local explanation')}</NoticeBox>
                ) : displayExplanation ? (
                    <div className={styles.chartContainer} style={{ position: 'relative' }}>
                        {(isLocalFetching || isComputingLocal || isTransitioning) && (
                            <div className={styles.loadingOverlay}><CircularLoader small /></div>
                        )}
                        <div className={styles.chartHeader}>
                            {(supports('waterfall') || supports('beeswarm')) ? (
                                <div className={styles.viewToggle}>
                                    {supports('waterfall') && (
                                        <button
                                            className={`${styles.toggleBtn} ${localView === 'waterfall' ? styles.toggleBtnActive : ''}`}
                                            onClick={() => setLocalView('waterfall')}
                                        >
                                            {i18n.t('Waterfall')}
                                        </button>
                                    )}
                                    {supports('beeswarm') && (
                                        <button
                                            className={`${styles.toggleBtn} ${localView === 'summary' ? styles.toggleBtnActive : ''}`}
                                            onClick={() => setLocalView('summary')}
                                        >
                                            {i18n.t('SHAP Summary')}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <Tag>{selectedXaiMethodObj?.displayName ?? selectedXaiMethod}</Tag>
                            )}
                            <Button small secondary onClick={handleRunExplanations} loading={isExplanationJobRunning} disabled={isExplanationJobRunning}>
                                {i18n.t('Recalculate')}
                            </Button>
                        </div>
                        {supports('waterfall') && localView === 'waterfall' ? (
                            <ShapWaterfallChart
                                key={`local-waterfall-${displayExplanation.id ?? 'new'}-${localOrgUnit}-${selectedPeriod}`}
                                features={displayExplanation.featureAttributions.map((f: any) => ({
                                    feature_name: f.feature_name || f.featureName, importance: f.importance,
                                    direction: f.direction, actual_value: f.actual_value ?? f.actualValue,
                                }))}
                                baselinePrediction={displayExplanation.baselinePrediction}
                                actualPrediction={displayExplanation.actualPrediction}
                                title={i18n.t('SHAP Waterfall — {{orgUnit}}, {{period}}', {
                                    orgUnit: orgUnitOptions.find(o => o.id === localOrgUnit)?.label ?? localOrgUnit,
                                    period: getPeriodLabel(selectedPeriod),
                                })}
                            />
                        ) : supports('beeswarm') && localView === 'summary' ? (
                            isBeeswarmLoading ? (
                                <div className={styles.loadingContainer}><CircularLoader small /></div>
                            ) : beeswarmData ? (
                                <ShapBeeswarmChart
                                    points={beeswarmData.points.filter(p => (p.orgUnit || (p as any).org_unit) === localOrgUnit)}
                                    featureNames={beeswarmData.featureNames || (beeswarmData as any).feature_names || []}
                                    highlightOrgUnit={localOrgUnit}
                                    highlightPeriod={selectedPeriod}
                                    orgUnitMap={orgUnitMap}
                                    title={i18n.t('SHAP Summary — {{orgUnit}}, {{period}} highlighted', {
                                        orgUnit: orgUnitOptions.find(o => o.id === localOrgUnit)?.label ?? localOrgUnit,
                                        period: getPeriodLabel(selectedPeriod),
                                    })}
                                />
                            ) : (
                                <div className={styles.emptyState}>
                                    <p>{i18n.t('Loading SHAP summary data...')}</p>
                                    <Button small primary onClick={handleLoadBeeswarm}>{i18n.t('Load')}</Button>
                                </div>
                            )
                        ) : (
                            <>
                                <NoticeBox>
                                    {i18n.t('LIME contributions are coefficients of a local linear approximation and do not decompose additively into the final prediction (unlike SHAP).')}
                                </NoticeBox>
                                <FeatureImportanceChart
                                    key={`local-lime-${displayExplanation.id ?? 'new'}-${localOrgUnit}-${selectedPeriod}`}
                                    features={displayExplanation.featureAttributions.map((f: any) => ({
                                        feature_name: f.feature_name || f.featureName, importance: f.importance, direction: f.direction,
                                    }))}
                                    title={i18n.t('LIME Feature Contributions — {{orgUnit}}, {{period}}', {
                                        orgUnit: orgUnitOptions.find(o => o.id === localOrgUnit)?.label ?? localOrgUnit,
                                        period: getPeriodLabel(selectedPeriod),
                                    })}
                                />
                            </>
                        )}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>{i18n.t('No explanation available for this selection.')}</p>
                        <Button primary onClick={handleRunExplanations} loading={isExplanationJobRunning} disabled={isExplanationJobRunning || !localOrgUnit || !selectedPeriod}>
                            {i18n.t('Explain This Forecast')}
                        </Button>
                    </div>
                )}
                </div>
            </div>
        );
    };

    const renderHorizonContent = () => {
        const orgLabel = orgUnitOptions.find(o => o.id === localOrgUnit)?.label ?? localOrgUnit;

        return (
            <div className={styles.mainLayout}>
                <div className={styles.sidebar}>
                    <Menu dense>
                        {orgUnitOptions.map(o => (
                            <MenuItem
                                active={localOrgUnit === o.id}
                                key={o.id}
                                label={o.label}
                                onClick={() => handleOrgUnitChange(o.id)}
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
                    <div className={styles.chartContainer} style={{ position: 'relative' }}>
                        {isHorizonLoading && (
                            <div className={styles.loadingOverlay}><CircularLoader small /></div>
                        )}
                        <div className={styles.chartHeader}>
                            <h4 className={styles.horizonTitle}>
                                {i18n.t('Forecast Horizon Summary — {{orgUnit}}', { orgUnit: orgLabel })}
                            </h4>
                            <Button small secondary onClick={handleRunExplanations} loading={isExplanationJobRunning} disabled={isExplanationJobRunning}>
                                {i18n.t('Recalculate')}
                            </Button>
                        </div>

                        {supports('beeswarm') && (
                            <div className={styles.viewToggle} style={{ alignSelf: 'flex-start' }}>
                                <button
                                    className={`${styles.toggleBtn} ${horizonView === 'importance' ? styles.toggleBtnActive : ''}`}
                                    onClick={() => setHorizonView('importance')}
                                >
                                    {i18n.t('Importance')}
                                </button>
                                <button
                                    className={`${styles.toggleBtn} ${horizonView === 'beeswarm' ? styles.toggleBtnActive : ''}`}
                                    onClick={() => setHorizonView('beeswarm')}
                                >
                                    {i18n.t('SHAP Summary')}
                                </button>
                            </div>
                        )}

                        {horizonView === 'importance' ? (
                            <>
                                <p className={styles.horizonDesc}>
                                    {i18n.t(
                                        'Average feature importance across all forecast steps in the horizon window. ' +
                                        'This shows which features are the dominant drivers for the upcoming period overall. ' +
                                        'Use the Local tab to inspect individual steps in detail.'
                                    )}
                                </p>

                                {horizonData.averageImportance.length > 0 && (
                                    <FeatureImportanceChart
                                        features={horizonData.averageImportance.map((f: any) => ({
                                            feature_name: f.featureName || f.feature_name,
                                            importance: f.meanAbsImportance || f.mean_abs_importance,
                                            direction: f.direction,
                                        }))}
                                        title={i18n.t('Average Horizon Importance — mean |SHAP| across {{n}} steps', {
                                            n: horizonData.steps.length,
                                        })}
                                    />
                                )}
                            </>
                        ) : isBeeswarmLoading ? (
                            <div className={styles.loadingContainer}><CircularLoader small /></div>
                        ) : beeswarmData ? (
                            <ShapBeeswarmChart
                                points={beeswarmData.points.filter(p => (p.orgUnit || (p as any).org_unit) === localOrgUnit)}
                                featureNames={beeswarmData.featureNames || (beeswarmData as any).feature_names || []}
                                orgUnitMap={orgUnitMap}
                                title={i18n.t('SHAP Summary — {{orgUnit}} across horizon steps', {
                                    orgUnit: orgLabel,
                                })}
                            />
                        ) : (
                            <div className={styles.emptyState}>
                                <p>{i18n.t('Loading SHAP summary data...')}</p>
                                <Button small primary onClick={handleLoadBeeswarm}>{i18n.t('Load')}</Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>{i18n.t('No horizon summary available.')}</p>
                        <Button primary onClick={handleRunExplanations} loading={isExplanationJobRunning} disabled={!localOrgUnit || isExplanationJobRunning}>
                            {i18n.t('Compute Horizon Summary')}
                        </Button>
                    </div>
                )}
                </div>
            </div>
        );
    };

    const isExplanationBundleReady = hasCompletedExplanationsForMethod;

    const renderPendingContent = () => (
        <div className={styles.emptyState}>
            <p>
                {isExplanationJobRunning
                    ? i18n.t('Generating explanations for Global, Local, and Horizon...')
                    : i18n.t('Generate explanations to view Global, Local, and Horizon plots.')}
            </p>
            <Button primary onClick={handleRunExplanations} loading={isExplanationJobRunning} disabled={isExplanationJobRunning}>
                {i18n.t('Compute Explanation')}
            </Button>
        </div>
    );

    const renderActiveTab = () => {
        if (!isExplanationBundleReady && !isExplanationJobRunning) {
            return renderPendingContent();
        }
        switch (activeTab) {
            case 'global': return renderGlobalContent();
            case 'local': return renderLocalContent();
            case 'horizon': return renderHorizonContent();
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
