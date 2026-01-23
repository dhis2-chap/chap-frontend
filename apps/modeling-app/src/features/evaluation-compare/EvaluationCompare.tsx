import { ComparisonPlotList } from '@dhis2-chap/ui';
import {
    EvaluationCompatibleSelector,
    EvaluationSelectorBase,
} from '../select-evaluation';
import { useMemo, useRef } from 'react';
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

    const {
        combined,
        isLoading: plotDataLoading,
        error,
    } = usePlotDataForEvaluations(selectedEvaluations, {
        orgUnits: selectedOrgUnits,
    });

    const { dataForSplitPeriod, periods } = useMemo(() => {
        const dataForSplitPeriod = combined.viewData
            .filter(v => v.splitPoint === selectedSplitPeriod)
            .flatMap(v =>
                v.evaluation.map(e => ({
                    ...e,
                    orgUnitName:
                        orgUnits?.find(ou => ou.id === e.orgUnitId)
                            ?.displayName ?? e.orgUnitId,
                })),
            )
            .sort((a, b) => a.orgUnitName.localeCompare(b.orgUnitName));
        const periods = dataForSplitPeriod[0]?.models[0].data.periods ?? [];
        return { dataForSplitPeriod, periods };
    }, [combined.viewData, selectedSplitPeriod, orgUnits]);

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
                        onChange={setSelectedSplitPoint}
                        periods={periods}
                    />
                </div>
            )}
            <div>
                {combined.viewData.length > 0 && (
                    <ComparisonPlotList
                        virtuosoProps={{
                            customScrollParent: scrollerRef.current,
                        }}
                        useVirtuoso={true}
                        evaluationPerOrgUnits={dataForSplitPeriod}
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
