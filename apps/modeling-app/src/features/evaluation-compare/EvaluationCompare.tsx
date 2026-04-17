import { ComparisonPlotList, getStableMaxYByOrgUnitId } from '@dhis2-chap/ui';
import type { ZoomRange } from '@dhis2-chap/ui';
import {
    EvaluationCompatibleSelector,
    EvaluationSelectorBase,
} from '../select-evaluation';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import cx from 'classnames';
import css from './EvaluationCompare.module.css';
import {
    Button,
    CircularLoader,
    IconArrowLeft16,
    IconArrowRight16,
    IconChevronLeft16,
    IconChevronRight16,
    IconVisualizationLine24,
    IconVisualizationLineMulti24,
    NoticeBox,
    Tooltip,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { usePlotDataForEvaluations } from '../../hooks/usePlotDataForEvaluations';
import { PageHeader } from '../common-features/PageHeader/PageHeader';
import OrganisationUnitMultiSelect from '../../components/OrganisationUnitsSelect/OrganisationUnitMultiSelect';
import { useCompareSelectionController } from './useCompareSelectionController';
import { SplitPeriodSlider } from './SplitPeriodSlider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ID_MAIN_LAYOUT } from '../../components/layout/Layout';
import { shouldIgnoreHotkey } from './shouldIgnoreHotkey';

const MAX_SELECTED_ORG_UNITS = 10;

export const EvaluationCompare = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/evaluate';
    const isFromDetails = returnTo.startsWith('/evaluate/') && returnTo !== '/evaluate';

    // reference to the scrollable container
    // used by virtuoso in ComparisonPlotList
    const scrollerRef = useRef<HTMLDivElement>(
        document.getElementById(ID_MAIN_LAYOUT) as HTMLDivElement,
    );

    const {
        selectedEvaluations,
        baseEvaluation,
        comparisonEvaluation,
        evaluations,
        orgUnits,
        selectedOrgUnits,
        selectedSplitPeriod,
        splitPeriods,
        hasNoMatchingSplitPeriods,
        setSelectedOrgUnits,
        setBaseEvaluation,
        setComparisonEvaluation,
        setSelectedSplitPeriod: setSelectedSplitPoint,
    } = useCompareSelectionController({
        maxSelectedOrgUnits: MAX_SELECTED_ORG_UNITS,
    });
    const deferredSelectedSplitPeriod = useDeferredValue(selectedSplitPeriod);
    const [, startSplitPeriodTransition] = useTransition();

    const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);
    const [isStuck, setIsStuck] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => setIsStuck(!entry.isIntersecting),
            { threshold: 0, root: document.getElementById(ID_MAIN_LAYOUT) },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const shiftZoom = useCallback(
        (direction: 1 | -1) => {
            setZoomRange((prev) => {
                if (!prev) return null;
                const newMin = prev.min + direction;
                const newMax = prev.max + direction;
                if (newMin < prev.dataMin || newMax > prev.dataMax) return prev;
                return { ...prev, min: newMin, max: newMax };
            });
        },
        [],
    );

    const resetZoom = useCallback(() => {
        setZoomRange(null);
    }, []);

    const isZoomed = zoomRange !== null;
    const canShiftLeft = isZoomed && zoomRange.min > zoomRange.dataMin;
    const canShiftRight = isZoomed && zoomRange.max < zoomRange.dataMax;

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (shouldIgnoreHotkey(event)) return;

            const key = event.key.toLowerCase();
            if (key === 'h' && canShiftLeft) {
                shiftZoom(-1);
            } else if (key === 'l' && canShiftRight) {
                shiftZoom(1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [shiftZoom, canShiftLeft, canShiftRight]);

    const {
        combined,
        isLoading: plotDataLoading,
        error,
    } = usePlotDataForEvaluations(selectedEvaluations, {
        orgUnits: selectedOrgUnits,
    });

    const maxYByOrgUnitId = useMemo(() => {
        return getStableMaxYByOrgUnitId(combined.viewData);
    }, [combined.viewData]);

    const orgUnitNameById = useMemo(() => {
        return new Map(
            (orgUnits ?? []).map(orgUnit => [orgUnit.id, orgUnit.displayName]),
        );
    }, [orgUnits]);

    const evaluationsBySplitPeriod = useMemo(() => {
        return new Map(
            combined.viewData.map(viewData => [
                viewData.splitPoint,
                viewData.evaluation,
            ]),
        );
    }, [combined.viewData]);

    const { dataForSplitPeriod, periods } = useMemo(() => {
        const dataForSplitPeriod =
            (evaluationsBySplitPeriod.get(deferredSelectedSplitPeriod) ?? [])
                .map(e => ({
                    ...e,
                    orgUnitName: orgUnitNameById.get(e.orgUnitId) ?? e.orgUnitId,
                }))
                .sort((a, b) => a.orgUnitName.localeCompare(b.orgUnitName));
        const periods = dataForSplitPeriod[0]?.models[0].data.periods ?? [];
        return { dataForSplitPeriod, periods };
    }, [
        deferredSelectedSplitPeriod,
        evaluationsBySplitPeriod,
        orgUnitNameById,
    ]);

    const handleSplitPointChange = useCallback((splitPoint: string) => {
        startSplitPeriodTransition(() => {
            setSelectedSplitPoint(splitPoint);
        });
    }, [setSelectedSplitPoint, startSplitPeriodTransition]);

    const customScrollParent = scrollerRef.current;
    const virtuosoProps = useMemo(
        () => ({ customScrollParent }),
        [customScrollParent],
    );

    return (
        <div className={css.wrapper}>
            <div className={css.selectionToolbar}>
                <PageHeader
                    pageTitle={i18n.t('Compare evaluations')}
                    pageDescription={i18n.t(
                        'Compare evaluations to assess model, co-variates and data performance.',
                    )}
                />
                <div>
                    <Button
                        small
                        icon={<IconArrowLeft16 />}
                        onClick={() => {
                            navigate(returnTo);
                        }}
                    >
                        {i18n.t(isFromDetails ? 'Back to evaluation details' : 'Back to evaluation')}
                    </Button>
                </div>
                {plotDataLoading && (
                    <div className={css.loaderWrapper}>
                        <CircularLoader small className={css.loader} />
                    </div>
                )}
            </div>
            <div ref={sentinelRef} />
            <div className={cx(css.stickyBar, { [css.stuck]: isStuck })}>
                <div className={css.selectorRow}>
                    <EvaluationSelectorBase
                        dense
                        onSelect={(evaluation1) => {
                            setZoomRange(null);
                            setBaseEvaluation(evaluation1?.id.toString());
                        }}
                        selected={baseEvaluation}
                        available={evaluations ?? []}
                        loading={evaluations === undefined}
                        placeholder={i18n.t('Select base evaluation')}
                    />
                    <EvaluationCompatibleSelector
                        dense
                        onSelect={(evaluation2) => {
                            setZoomRange(null);
                            setComparisonEvaluation(evaluation2?.id.toString());
                        }}
                        selected={comparisonEvaluation}
                        compatibleEvaluationId={baseEvaluation?.id}
                    />
                    <OrganisationUnitMultiSelect
                        dense
                        prefix={i18n.t('Location(s)')}
                        selected={selectedOrgUnits}
                        disabled={!orgUnits}
                        onSelect={({ selected }) =>
                            setSelectedOrgUnits(selected)}
                        available={orgUnits ?? []}
                        inputMaxHeight="52px"
                        maxSelections={MAX_SELECTED_ORG_UNITS}
                        collapseSelectionAfter={0}
                    />
                </div>
                <div className={css.zoomButtons}>
                    <Tooltip content={i18n.t('Shift zoom left (H)')}>
                        <Button
                            small
                            secondary
                            disabled={!canShiftLeft}
                            onClick={() => shiftZoom(-1)}
                            aria-label={i18n.t('Shift zoom left one period')}
                            icon={<IconChevronLeft16 />}
                        />
                    </Tooltip>
                    <Button
                        small
                        secondary
                        disabled={!isZoomed}
                        onClick={resetZoom}
                    >
                        {i18n.t('Reset zoom')}
                    </Button>
                    <Tooltip content={i18n.t('Shift zoom right (L)')}>
                        <Button
                            small
                            secondary
                            disabled={!canShiftRight}
                            onClick={() => shiftZoom(1)}
                            aria-label={i18n.t('Shift zoom right one period')}
                            icon={<IconChevronRight16 />}
                        />
                    </Tooltip>
                </div>
            </div>
            {hasNoMatchingSplitPeriods && (
                <NoticeBox warning>
                    {i18n.t(
                        'Selected evaluations do not have any split periods in common. Please select evaluations with overlapping split periods.',
                    )}
                </NoticeBox>
            )}
            {!!error && (
                <NoticeBox
                    title={i18n.t(
                        'An error occurred while fetching chart data ',
                    )}
                    error
                >
                    {error.message}
                </NoticeBox>
            )}
            {splitPeriods.length > 0 && periods.length > 0 && (
                <div className={css.footerSlider}>
                    <SplitPeriodSlider
                        splitPeriods={splitPeriods}
                        selectedSplitPeriod={selectedSplitPeriod}
                        onChange={handleSplitPointChange}
                        periods={periods}
                    />
                </div>
            )}
            <div>
                {combined.viewData.length > 0 && (
                    <ComparisonPlotList
                        virtuosoProps={virtuosoProps}
                        useVirtuoso={true}
                        evaluationPerOrgUnits={dataForSplitPeriod}
                        maxYByOrgUnitId={maxYByOrgUnitId}
                        nameLabel={i18n.t('Evaluation')}
                        zoomRange={zoomRange}
                        onZoomChange={setZoomRange}
                    />
                )}
            </div>
            {selectedEvaluations.length === 0 && <EmptySelection />}
        </div>
    );
};

export default EvaluationCompare;

const EmptySelection = () => {
    return (
        <div className={css.emptySelection}>
            <div className={css.iconGroup}>
                <IconVisualizationLine24 />
                <div className={css.arrowIcons}>
                    <IconArrowRight16 />
                    <IconArrowLeft16 />
                </div>
                <IconVisualizationLineMulti24 />
            </div>
            <div className={css.textGroup}>
                <p>
                    {i18n.t(`Select two evaluations to compare their results. The
                    selected evaluations must be compatible.`)}
                </p>
                <p>
                    {i18n.t(
                        `Compatible evaluations have overlapping organisation units and split periods.`,
                    )}
                </p>
            </div>
        </div>
    );
};
