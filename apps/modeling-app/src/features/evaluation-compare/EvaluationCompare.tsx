import { ComparisonPlotList, getStableMaxYByOrgUnitId } from '@dhis2-chap/ui';
import {
    EvaluationCompatibleSelector,
    EvaluationSelectorBase,
} from '../select-evaluation';
import { useCallback, useDeferredValue, useMemo, useRef, useTransition } from 'react';
import css from './EvaluationCompare.module.css';
import {
    Button,
    CircularLoader,
    IconArrowLeft16,
    IconArrowRight16,
    IconVisualizationLine24,
    IconVisualizationLineMulti24,
    NoticeBox,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { usePlotDataForEvaluations } from '../../hooks/usePlotDataForEvaluations';
import { PageHeader } from '../common-features/PageHeader/PageHeader';
import OrganisationUnitMultiSelect from '../../components/OrganisationUnitsSelect/OrganisationUnitMultiSelect';
import { useCompareSelectionController } from './useCompareSelectionController';
import { SplitPeriodSlider } from './SplitPeriodSlider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ID_MAIN_LAYOUT } from '../../components/layout/Layout';

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
                <div className={css.compareSelectors}>
                    <EvaluationSelectorBase
                        onSelect={(evaluation1) => {
                            setBaseEvaluation(evaluation1?.id.toString());
                        }}
                        selected={baseEvaluation}
                        available={evaluations ?? []}
                        loading={evaluations === undefined}
                        placeholder={i18n.t('Select base evaluation')}
                    />
                    <EvaluationCompatibleSelector
                        onSelect={(evaluation2) => {
                            setComparisonEvaluation(evaluation2?.id.toString());
                        }}
                        selected={comparisonEvaluation}
                        compatibleEvaluationId={baseEvaluation?.id}
                    />
                </div>
                <div className={css.selectorRow}>
                    <OrganisationUnitMultiSelect
                        prefix={i18n.t('Organisation Units')}
                        selected={selectedOrgUnits}
                        disabled={!orgUnits}
                        onSelect={({ selected }) =>
                            setSelectedOrgUnits(selected)}
                        available={orgUnits ?? []}
                        inputMaxHeight="52px"
                        maxSelections={MAX_SELECTED_ORG_UNITS}
                    />
                </div>
                {plotDataLoading && (
                    <div className={css.loaderWrapper}>
                        <CircularLoader small className={css.loader} />
                    </div>
                )}
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
